from flask import Flask, jsonify
from flask_cors import CORS
from youtube_fetcher import get_video_data
import os
import firebase_admin
from firebase_admin import credentials, firestore
import logging
from flask import Flask, jsonify, request
import datetime
import pytz


# ✅ 設定 logging，會輸出到 Cloud Run logs
logging.basicConfig(level=logging.INFO)

# ✅ 初始化 Firebase Admin SDK
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("firebase-key.json")
        firebase_admin.initialize_app(cred)
        logging.info("✅ Firebase Admin 初始化成功")
    except Exception as e:
        logging.error("❌ 初始化 Firebase Admin 失敗", exc_info=True)

# ✅ 建立 Firestore 用戶端
try:
    db = firestore.client()
except Exception as e:
    logging.error("❌ 初始化 Firestore 客戶端失敗", exc_info=True)

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return "✅ YouTube API Service with Firestore Cache is running."

@app.route("/videos")
def videos():
    try:
        doc = db.collection("videos").document("latest").get()
        if doc.exists and "data" in doc.to_dict():
            return jsonify(doc.to_dict()["data"])
        else:
            logging.warning("⚠️ Firestore 無快取資料或格式錯誤")
            return jsonify([])
    except Exception as e:
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
            try:
                start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
                end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d"))
                date_ranges = [(start_dt, end_dt)]
                logging.info(f"📆 使用前端指定日期範圍：{start} ~ {end}")
            except Exception as e:
                logging.warning(f"❌ 日期格式錯誤：{e}")

        data = get_video_data(date_ranges=date_ranges)
        db.collection("videos").document("latest").set({"data": data})
        logging.info(f"✅ 快取已更新，共 {len(data)} 筆")
        return jsonify({"message": "✅ 快取已更新", "count": len(data)})
    except Exception as e:
        logging.error("🔥 /refresh-cache 發生例外錯誤", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
