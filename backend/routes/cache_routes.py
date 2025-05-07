from flask import Blueprint, request, jsonify
import logging
from services.video_cache_service import update_latest_videos
from services.firestore.batch_writer import (
    get_last_video_sync_time,
    write_batches_to_firestore,
    update_last_sync_time,
)
from services.youtube.fetcher import get_video_data
from datetime import datetime, timezone, timedelta

cache_bp = Blueprint("cache", __name__)
logger = logging.getLogger(__name__)

def init_cache_routes(app, db):
    @cache_bp.route("/api/cache/update-latest-videos", methods=["POST"])
    def update_latest():
        try:
            data = request.get_json()
            channel_id = data.get("channel_id")

            if not channel_id:
                logger.warning("⚠️ 缺少 channel_id")
                return jsonify({"error": "缺少 channel_id"}), 400

            logger.info(f"🔄 [update-latest-videos] 處理頻道：{channel_id}")
            result = update_latest_videos(db, channel_id)

            return jsonify({
                "message": "✅ 最新影片快取更新完成",
                "added": result["added"],
                "skipped": result["skipped"],
                "updatedSyncTime": result["updatedSyncTime"]
            })
        except Exception as e:
            logger.exception("🔥 /api/cache/update-latest-videos 發生例外錯誤")
            return jsonify({
                "error": "更新最新影片時發生錯誤",
                "details": str(e)
            }), 500

    @cache_bp.route("/api/cache/fetch-youtube-videos", methods=["POST"])
    def fetch_youtube_videos():
        try:
            data = request.get_json()
            channel_id = data.get("channel_id")
            if not channel_id:
                logger.warning("⚠️ 缺少 channel_id")
                return jsonify({"error": "缺少 channel_id"}), 400

            logger.info(f"📡 [fetch-youtube-videos] 開始處理頻道：{channel_id}")

            last_sync_time = get_last_video_sync_time(db, channel_id)
            now = datetime.now(timezone.utc)
            safe_sync_time = last_sync_time + timedelta(seconds=1) if last_sync_time else None
            date_ranges = [(safe_sync_time, now)] if safe_sync_time else None


            videos = get_video_data(date_ranges=date_ranges, input_channel=channel_id)
            if not videos:
                logger.info("📭 無新影片可匯入")
                return jsonify({
                    "message": "✅ 無新影片可匯入",
                    "channel_id": channel_id,
                    "videos_written": 0,
                    "batches_written": 0
                })

            write_result = write_batches_to_firestore(db, channel_id, videos)
            latest_time = update_last_sync_time(db, channel_id, videos)

            return jsonify({
                "message": "✅ 新影片已成功寫入 Firestore",
                "channel_id": channel_id,
                "videos_written": write_result.get("videos_written", 0),
                "batches_written": write_result.get("batches_written", 0),
                "lastVideoSyncAt": latest_time
            })
        except Exception as e:
            logger.exception("🔥 /api/cache/fetch-youtube-videos 發生例外錯誤")
            return jsonify({
                "error": "匯入影片時發生錯誤",
                "details": str(e)
            }), 500

    app.register_blueprint(cache_bp)
    logger.info("✅ [cache_routes] 所有 cache API route 已註冊")
