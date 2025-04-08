from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import datetime
import pytz

from services.firebase import init_firestore
from services.cache import refresh_video_cache, overwrite_video_cache, get_latest_cache
from services.categories import sync_category, get_all_categories
from utils.categorizer import categorize_title_by_keywords

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

db = init_firestore()

@app.route("/")
def index():
    return "✅ YouTube API Service with Firestore Cache is running."

@app.route("/videos")
def videos():
    try:
        return jsonify(get_latest_cache(db))
    except Exception:
        logging.error("🔥 /videos 發生例外錯誤", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/refresh-cache")
def refresh_cache():
    try:
        start = request.args.get("start")
        end = request.args.get("end")

        tz = pytz.timezone("Asia/Taipei")
        date_ranges = None
        if start and end:
            start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
            end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d"))
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

@app.route("/api/cache/overwrite", methods=["POST"])
def overwrite_cache():
    try:
        data = request.get_json()
        start = data.get("start")
        end = data.get("end")
        if not start or not end:
            return jsonify({"error": "請提供 start 與 end 日期"}), 400

        tz = pytz.timezone("Asia/Taipei")
        start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
        end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d"))
        new_data = overwrite_video_cache(db, [(start_dt, end_dt)])

        return jsonify({
            "message": "🧨 快取已強制覆寫",
            "count": len(new_data)
        })
    except Exception:
        logging.error("🔥 /api/cache/overwrite 發生例外錯誤", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/api/categories", methods=["GET"])
def api_get_categories():
    return jsonify(get_all_categories(db))

@app.route("/api/categories/sync", methods=["POST"])
def sync_categories_route():
    incoming_data = request.get_json()
    if not isinstance(incoming_data, list):
        return jsonify({"error": "請傳入分類陣列"}), 400
    for item in incoming_data:
        sync_category(db, item)
    return jsonify({"message": "同步完成"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
