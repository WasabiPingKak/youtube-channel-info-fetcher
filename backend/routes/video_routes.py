from flask import Blueprint, request, jsonify
from services.classified_video_fetcher import get_classified_videos
import logging

logger = logging.getLogger(__name__)
video_bp = Blueprint("video", __name__)

def init_video_routes(app, db):
    @video_bp.route("/api/videos/classified", methods=["POST"])
    def get_classified():
        try:
            data = request.get_json()
            channel_id = data.get("channel_id")
            video_type = data.get("video_type")

            if not channel_id or not video_type:
                return jsonify({"error": "channel_id 與 video_type 為必填"}), 400

            logger.info(f"🔍 取得分類影片清單：{channel_id}, 類型={video_type}")
            result = get_classified_videos(db, channel_id, video_type)

            return jsonify({"videos": result})

        except Exception as e:
            logger.exception("🔥 /api/videos/classified 發生錯誤")
            return jsonify({
                "error": "發生錯誤",
                "details": str(e)
            }), 500

    app.register_blueprint(video_bp)
    logger.info("✅ [video_routes] /api/videos/classified 已註冊")
