
from flask import Blueprint, request, jsonify
import datetime
import pytz
import logging
from services.cache import refresh_video_cache

cache_bp = Blueprint("cache", __name__)

def init_cache_routes(app, db):
    @cache_bp.route("/api/cache/classify-and-save", methods=["POST"])
    def classify_and_save():
        try:
            print("✅ [classify-and-save] API 呼叫進入")
            data = request.get_json()
            channel_id = data.get("channel_id")
            start = data.get("start")
            end = data.get("end")

            if not channel_id:
                return jsonify({"error": "缺少 channel_id"}), 400

            # 處理時間區間（選填）
            date_ranges = None
            if start and end:
                tz = pytz.timezone("Asia/Taipei")
                start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
                start_dt = start_dt.astimezone(pytz.UTC)
                end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d") + datetime.timedelta(days=1))
                end_dt = end_dt.astimezone(pytz.UTC)
                date_ranges = [(start_dt, end_dt)]

            # 呼叫新版分類快取邏輯
            fetched_data = refresh_video_cache(db, channel_id, date_ranges)

            return jsonify({
                "message": "✅ 已完成分類並寫入快取",
                "count": len(fetched_data or [])
            })
        except Exception:
            logging.error("🔥 /api/cache/classify-and-save 發生例外錯誤", exc_info=True)
            return jsonify({"error": "Internal Server Error"}), 500

    app.register_blueprint(cache_bp)
    print("✅ [cache_routes] /api/cache/classify-and-save route registered")
