import logging
import os
import requests
from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
from datetime import datetime, timedelta, timezone

live_redirect_bp = Blueprint("live_redirect", __name__)
YOUTUBE_API_KEY = os.getenv("API_KEY")
CACHE_DOC_PATH = ("live_redirect_cache", "current")
QUEUE_DOC_PATH = ("live_redirect_notify_queue", "current")
CHANNEL_INDEX_COLLECTION = "channel_index"
YOUTUBE_API = "https://www.googleapis.com/youtube/v3/videos"


def build_live_redirect_cache_entries(videos: list, db: Client, now: datetime):
    output_channels = []
    processed_video_ids = []

    for video in videos:
        video_id = video.get("videoId")
        channel_id = video.get("channelId")
        if not video_id or not channel_id:
            continue

        logging.info(f"🔍 查詢影片：{video_id}")

        # 呼叫 YouTube API
        params = {
            "part": "snippet,liveStreamingDetails",
            "id": video_id,
            "key": YOUTUBE_API_KEY
        }
        yt_resp = requests.get(YOUTUBE_API, params=params)
        if yt_resp.status_code != 200:
            logging.warning(f"⚠️ YouTube API 錯誤：{video_id} - {yt_resp.status_code}")
            continue

        items = yt_resp.json().get("items", [])
        if not items:
            continue

        item = items[0]
        snippet = item.get("snippet", {})
        live_details = item.get("liveStreamingDetails", {})

        if not live_details:
            logging.info(f"🟡 不是直播影片，略過但標記為已處理：{channel_id} / {video_id}")
            processed_video_ids.append(video_id)
            continue

        actual_start = live_details.get("actualStartTime")
        scheduled_start = live_details.get("scheduledStartTime")
        actual_end = live_details.get("actualEndTime")
        viewers = int(live_details.get("concurrentViewers", "0"))

        is_live = False
        is_upcoming = False
        start_time = None

        if actual_end:
            start_time = actual_start or scheduled_start
        else:
            if actual_start and datetime.fromisoformat(actual_start) <= now:
                is_live = True
                is_upcoming = False
                start_time = actual_start
            elif scheduled_start and datetime.fromisoformat(scheduled_start) <= now + timedelta(minutes=15):
                is_live = True
                is_upcoming = True
                start_time = scheduled_start

        logging.debug(
            f"🧪 判斷影片狀態 - channel: {channel_id} / video: {video_id}\n"
            f"  actualStartTime: {actual_start}\n"
            f"  scheduledStartTime: {scheduled_start}\n"
            f"  actualEndTime: {actual_end}\n"
            f"  viewers: {viewers}\n"
            f"  → 判定結果: is_live={is_live}, is_upcoming={is_upcoming}, start_time={start_time}"
        )

        if not is_live and not actual_end:
            continue

        # 取得頻道資料
        channel_doc = db.collection(CHANNEL_INDEX_COLLECTION).document(channel_id).get()
        if not channel_doc.exists:
            logging.warning(f"❗找不到頻道資料：{channel_id}")
            continue
        channel_data = channel_doc.to_dict()

        output_channels.append({
            "channel_id": channel_id,
            "name": channel_data.get("name"),
            "thumbnail": channel_data.get("thumbnail"),
            "badge": channel_data.get("badge"),
            "countryCode": channel_data.get("countryCode", []),
            "live": {
                "videoId": video_id,
                "title": snippet.get("title"),
                "startTime": start_time,
                "viewers": viewers,
                "isUpcoming": is_upcoming,
                "endTime": actual_end
            }
        })

        logging.info(f"✅ 納入快取：{channel_id} / {video_id}")
        processed_video_ids.append(video_id)

    return output_channels, processed_video_ids


def init_live_redirect_route(app, db: Client):
    @live_redirect_bp.route("/api/live-redirect/cache", methods=["GET"])
    def get_live_redirect_cache():
        try:
            force = request.args.get("force", "false").lower() == "true"
            now = datetime.now(timezone.utc)

            # 讀主快取
            cache_ref = db.collection(CACHE_DOC_PATH[0]).document(CACHE_DOC_PATH[1])
            cache_data = cache_ref.get().to_dict() or {}
            updated_at = cache_data.get("updatedAt")

            if not force and updated_at:
                updated_time = datetime.fromisoformat(updated_at)
                if now - updated_time < timedelta(minutes=5):
                    logging.info("♻️ 快取未過期，直接回傳")
                    return jsonify(cache_data)

            # 讀通知佇列
            queue_ref = db.collection(QUEUE_DOC_PATH[0]).document(QUEUE_DOC_PATH[1])
            queue_data = queue_ref.get().to_dict() or {}
            videos = queue_data.get("videos", [])

            # 備份舊快取資料（僅非 force 模式時合併）
            existing_channels = cache_data.get("channels", []) if not force else []
            existing_map = {c["live"]["videoId"]: c for c in existing_channels}

            # 所有影片一律重新查詢，但是否更新 processedAt 由 force 控制
            new_channels, processed_video_ids = build_live_redirect_cache_entries(videos, db, now)
            for c in new_channels:
                vid = c["live"]["videoId"]
                existing_map[vid] = c  # 合併新舊快取

            merged_channels = list(existing_map.values())

            # 寫入快取
            cache_ref.set({
                "updatedAt": now.isoformat(),
                "channels": merged_channels
            })

            # 更新佇列的 processedAt（只有在 force 時更新）
            new_videos = []
            for v in videos:
                if v.get("videoId") in processed_video_ids:
                    if force or not v.get("processedAt"):
                        v["processedAt"] = now.isoformat()
                new_videos.append(v)

            queue_ref.set({
                "updatedAt": now.isoformat(),
                "videos": new_videos
            })

            logging.info(f"✅ 快取重建完成，channels={len(merged_channels)}，更新影片={len(processed_video_ids)}")

            return jsonify({
                "updatedAt": now.isoformat(),
                "channels": merged_channels
            })

        except Exception:
            logging.exception("🔥 快取重建流程失敗")
            return jsonify({"error": "Internal Server Error"}), 500

    app.register_blueprint(live_redirect_bp)
