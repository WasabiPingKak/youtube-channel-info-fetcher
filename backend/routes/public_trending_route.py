from flask import Blueprint, jsonify
import logging
from google.cloud.firestore import Client
from services.trending.trending_service import get_trending_games_summary

logger = logging.getLogger(__name__)
bp = Blueprint("public_trending", __name__)

def init_public_trending_route(app, db: Client):
    @bp.route("/api/trending-games", methods=["GET"])
    def trending_games_api():
        try:
            logger.info("🚀 [GET /api/trending-games] 處理開始")
            result = get_trending_games_summary(db)

            if "error" in result:
                logger.warning("⚠️ 回傳包含錯誤訊息")
                return jsonify(result), 500

            logger.info("✅ 趨勢資料傳回成功")
            return jsonify(result)

        except Exception as e:
            logger.error("🔥 /api/trending-games 發生例外錯誤", exc_info=True)
            return jsonify({"error": str(e)}), 500

    app.register_blueprint(bp)
