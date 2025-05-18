from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
import logging

from services.trending.daily_builder import build_trending_for_date_range

logger = logging.getLogger(__name__)

def init_internal_trending_route(app, db: Client):
    bp = Blueprint("internal_trending", __name__, url_prefix="/api/internal")

    @bp.route("/build-daily-trending", methods=["POST"])
    def build_daily_trending_api():
        try:
            data = request.get_json(force=True)
            start_date = data.get("startDate")
            days = int(data.get("days", 1))
            force = bool(data.get("force", False))

            if not start_date:
                return jsonify({"error": "請提供 startDate 參數（YYYY-MM-DD）"}), 400
            if days <= 0:
                return jsonify({"error": "days 參數必須為正整數"}), 400

            logger.info(f"🚀 開始處理 build_daily_trending | start={start_date} | days={days} | force={force}")
            result = build_trending_for_date_range(start_date, days, db, force=force)
            return jsonify(result)

        except Exception as e:
            logger.error("❌ /build-daily-trending 發生錯誤", exc_info=True)
            return jsonify({"error": str(e)}), 500

    app.register_blueprint(bp)
