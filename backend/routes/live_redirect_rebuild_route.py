import logging
import os
import time
import requests
from flask import Blueprint, request, Response
from google.cloud.firestore import Client
from datetime import datetime, timedelta, timezone

rebuild_bp = Blueprint("live_redirect_rebuild", __name__)
YOUTUBE_API_KEY = os.getenv("API_KEY")
CACHE_DOC_PATH = ("live_redirect_cache", "current")
QUEUE_DOC_PATH = ("live_redirect_notify_queue", "current")
CHANNEL_INDEX_COLLECTION = "channel_index"
YOUTUBE_API = "https://www.googleapis.com/youtube/v3/videos"

def build_live_redirect_cache_entries(videos: list, db: Client, force: bool, now: datetime):
    output_channels = []
    processed_video_ids = []

    for video in videos:
        video_id = video.get("videoId")
        channel_id = video.get("channelId")
        processed_at = video.get("processedAt")
        if not video_id or not channel_id:
            continue
        if not force and processed_at:
            continue

        logging.info(f"🔍 重新查詢影片：{video_id}")

        # 呼叫 YouTube videos.list API
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
            continue  # 找不到影片

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

        logging.info(
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

        logging.info(f"✅ 寫入快取成功：{channel_id} / {video_id}")
        processed_video_ids.append(video_id)

    return output_channels, processed_video_ids


def init_live_redirect_rebuild_route(app, db: Client):
    @rebuild_bp.route("/api/live-redirect/rebuild-cache", methods=["GET"])
    def rebuild_live_redirect_cache():
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
                    return Response("✅ 快取未過期，略過重建", status=200)

            # 讀通知佇列
            queue_ref = db.collection(QUEUE_DOC_PATH[0]).document(QUEUE_DOC_PATH[1])
            queue_data = queue_ref.get().to_dict() or {}
            videos = queue_data.get("videos", [])

            # 封裝處理主體
            output_channels, processed_video_ids = build_live_redirect_cache_entries(videos, db, force, now)

            # 寫入主快取
            cache_ref.set({
                "updatedAt": now.isoformat(),
                "channels": output_channels
            })

            # 更新 processedAt
            new_videos = []
            for v in videos:
                if v.get("videoId") in processed_video_ids or force:
                    v["processedAt"] = now.isoformat()
                new_videos.append(v)

            queue_ref.set({
                "updatedAt": now.isoformat(),
                "videos": new_videos
            })

            # 彙整處理結果
            summary_lines = [
                f"✅ 快取重建完成，共處理 {len(processed_video_ids)} 支影片："
            ]
            for entry in output_channels:
                video_id = entry["live"]["videoId"]
                channel_id = entry["channel_id"]
                title = entry["live"].get("title", "(無標題)")
                summary_lines.append(f"- {channel_id} / {video_id} - {title}")

            summary_text = "\n".join(summary_lines)

            # 印出處理清單
            logging.info(summary_text)

            # 回傳結果
            return Response(summary_text, status=200, content_type="text/plain")

        except Exception as e:
            logging.error("🔥 rebuild-cache 錯誤", exc_info=True)
            return Response("Internal Server Error", status=500)

    app.register_blueprint(rebuild_bp)
