from flask import Blueprint, request, jsonify
import datetime
import pytz
import logging
from services.cache import get_latest_cache, refresh_video_cache, overwrite_video_cache

cache_bp = Blueprint("cache", __name__)

def init_cache_routes(app, db):
    @cache_bp.route("/videos")
    def videos():
        try:
            return jsonify(get_latest_cache(db))
        except Exception:
            logging.error("🔥 /videos 發生例外錯誤", exc_info=True)
            return jsonify({"error": "Internal Server Error"}), 500

    @cache_bp.route("/refresh-cache")
    def refresh_cache():
        try:
            start = request.args.get("start")
            end = request.args.get("end")
            tz = pytz.timezone("Asia/Taipei")
            date_ranges = None
            if start and end:
                start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
                start_dt = start_dt.astimezone(pytz.UTC)
                end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d") + datetime.timedelta(days=1))
                end_dt = end_dt.astimezone(pytz.UTC)
                end_dt = end_dt.astimezone(pytz.UTC)
                date_ranges = [(start_dt, end_dt)]
            merged_data, new_data = refresh_video_cache(db, date_ranges)
            return jsonify({
                "message": "✅ 快取已合併更新",
                "total": len(merged_data),
                "new_added": len(new_data)
            })
        except Exception:
            logging.error("🔥 /refresh-cache 發生例外錯誤", exc_info=True)
            return jsonify({"error": "Internal Server Error"}), 500

    @cache_bp.route("/api/cache/overwrite", methods=["POST"])
    def overwrite_cache():
        try:
            data = request.get_json()
            start = data.get("start")
            end = data.get("end")
            if not start or not end:
                return jsonify({"error": "請提供 start 與 end 日期"}), 400

            tz = pytz.timezone("Asia/Taipei")
            start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
            start_dt = start_dt.astimezone(pytz.UTC)
            end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d") + datetime.timedelta(days=1))
            end_dt = end_dt.astimezone(pytz.UTC)
            new_data = overwrite_video_cache(db, [(start_dt, end_dt)])

            return jsonify({
                "message": "快取已強制覆寫",
                "count": len(new_data)
            })
        except Exception:
            logging.error("🔥 /api/cache/overwrite 發生例外錯誤", exc_info=True)
            return jsonify({"error": "Internal Server Error"}), 500

    app.register_blueprint(cache_bp)
