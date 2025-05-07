from flask import Blueprint, request, jsonify
import logging
from services.video_cache_service import update_latest_videos

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

    app.register_blueprint(cache_bp)
    logger.info("✅ [cache_routes] /api/cache/update-latest-videos route registered")
