print("✅ [routes/cache_channel_videos.py] module loaded")
from flask import Blueprint, request, jsonify
import datetime
import pytz
import logging
from firebase_admin import firestore

from services.youtube.fetcher import get_video_data
from services.firebase import init_firestore
from utils.categorizer import match_category_and_game

cache_v2_bp = Blueprint("cache_v2", __name__)

def init_cache_v2_routes(app):
    print("✅ /api/cache/channel-videos route loaded")

    @cache_v2_bp.route("/api/cache/channel-videos", methods=["POST"])
    def cache_channel_videos():
        try:
            data = request.get_json()
            channel_id = data.get("channel_id")
            start_date = data.get("start_date")
            end_date = data.get("end_date")

            if not (channel_id and start_date and end_date):
                return jsonify({"error": "請提供 channel_id, start_date, end_date"}), 400

            tz = pytz.timezone("Asia/Taipei")
            start_dt = tz.localize(datetime.datetime.strptime(start_date, "%Y-%m-%d")).astimezone(pytz.UTC)
            end_dt = tz.localize(datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)).astimezone(pytz.UTC)
            date_ranges = [(start_dt, end_dt)]

            db = init_firestore()
            fs = firestore.client()

            settings_doc = fs.collection("channel_settings").document(channel_id).get()
            if not settings_doc.exists:
                return jsonify({"error": f"找不到頻道分類設定：{channel_id}"}), 404
            settings = settings_doc.to_dict()

            all_videos = get_video_data(date_ranges=date_ranges, input_channel=channel_id)
            collection_ref = fs.collection("videos").document(channel_id).collection("items")

            existing_ids = set()
            query = collection_ref.where("publishDate", ">=", start_dt.isoformat()).where("publishDate", "<", end_dt.isoformat())
            for doc in query.stream():
                existing_ids.add(doc.id)

            logging.info(f"🧩 開始分類與寫入，共 {len(all_videos)} 支影片")
            saved_videos = []
            for idx, video in enumerate(all_videos, start=1):
                logging.debug(f"🔹 處理第 {idx} 支影片: {video.get('id')}")
                if "id" not in video:
                    logging.warning(f"⚠️ 略過影片：缺少 id 欄位 -> {video}")
                    continue

                if video["id"] in existing_ids:
                    logging.info(f"⏩ 已存在於快取中，略過：{video['id']}")
                    continue

                try:
                    title = video["snippet"]["title"]
                    duration_str = video["contentDetails"]["duration"]
                    publish_at = video["snippet"]["publishedAt"]
                    duration_sec = video.get("duration", 0)

                    match = match_category_and_game(
                        title=title,
                        video_type=video.get("type", "video"),
                        settings=settings
                    )

                    doc_data = {
                        "videoId": video["id"],
                        "title": title,
                        "publishDate": publish_at,
                        "duration": duration_sec,
                        "type": video.get("type", "video"),
                        "matchedCategories": match.get("matchedCategories") or ["其他"],
                        "game": match.get("game"),
                        "matchedKeywords": match.get("matchedKeywords", [])
                    }

                    collection_ref.document(video["id"]).set(doc_data)
                    logging.info(f"✅ 寫入完成：{video['id']} -> 類別: {doc_data['matchedCategories']} 遊戲: {doc_data['game']}")
                    saved_videos.append(doc_data)

                except Exception as ve:
                    logging.error(f"❌ 處理影片失敗：{video.get('id')} -> {ve}", exc_info=True)

            return jsonify({
                "channel_id": channel_id,
                "cached": len(saved_videos),
                "skipped": len(all_videos) - len(saved_videos),
                "videos": saved_videos
            })

        except Exception as e:
            logging.error("🔥 快取分類發生錯誤: %s", e, exc_info=True)
            return jsonify({"error": "內部錯誤"}), 500

    @cache_v2_bp.route("/ping", methods=["GET"])
    def ping():
        return "✅ /ping from cache_channel_videos OK"

    app.register_blueprint(cache_v2_bp)