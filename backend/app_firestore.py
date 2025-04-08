from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os
import datetime
import pytz
from youtube_fetcher import get_video_data

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

        # 🔹 取得新的影片資料
        new_data = get_video_data(date_ranges=date_ranges)

        # 🔹 取得舊的快取資料
        old_doc = db.collection("videos").document("latest").get()
        old_data = old_doc.to_dict().get("data", []) if old_doc.exists else []

        # 🔹 合併去重（依 videoId）
        combined = {v["videoId"]: v for v in old_data}
        for item in new_data:
            combined[item["videoId"]] = item  # 新的會覆蓋舊的（或新增）

        merged_data = list(combined.values())
        db.collection("videos").document("latest").set({"data": merged_data})

        logging.info(f"✅ 快取已合併更新，總共 {len(merged_data)} 筆（新增 {len(new_data)} 筆）")
        return jsonify({
            "message": "✅ 快取已合併更新",
            "total": len(merged_data),
            "new_added": len(new_data)
        })

    except Exception as e:
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
        try:
            start_dt = tz.localize(datetime.datetime.strptime(start, "%Y-%m-%d"))
            end_dt = tz.localize(datetime.datetime.strptime(end, "%Y-%m-%d"))
            date_ranges = [(start_dt, end_dt)]
            logging.info(f"🧨 強制快取覆寫：{start} ~ {end}")
        except Exception as e:
            logging.warning(f"❌ 日期格式錯誤：{e}")
            return jsonify({"error": "日期格式錯誤，請使用 YYYY-MM-DD"}), 400

        # 取得新資料並直接覆寫
        new_data = get_video_data(date_ranges=date_ranges)
        db.collection("videos").document("latest").set({"data": new_data})

        logging.info(f"🧨 快取已覆寫，共 {len(new_data)} 筆")
        return jsonify({
            "message": "🧨 快取已強制覆寫",
            "count": len(new_data)
        })

    except Exception as e:
        logging.error("🔥 /api/cache/overwrite 發生例外錯誤", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

# 🔹 GET: 取得所有分類
@app.route("/api/categories", methods=["GET"])
def get_categories():
    categories_ref = db.collection("categories").stream()
    categories = [{"id": cat.id, **cat.to_dict()} for cat in categories_ref]
    return jsonify(categories)

# 🔁 POST: 同步分類與關鍵字（支援 sync 與 replace 模式）
@app.route("/api/categories/sync", methods=["POST"])
def sync_categories():
    incoming_data = request.get_json()
    if not isinstance(incoming_data, list):
        return jsonify({"error": "請傳入分類陣列"}), 400

    for item in incoming_data:
        name = item.get("name")
        keywords = item.get("keywords", [])
        mode = item.get("mode", "sync")  # 預設為 sync 模式

        if not name or not isinstance(keywords, list):
            continue  # 跳過不合法資料

        existing = db.collection("categories").where("name", "==", name).get()
        if existing:
            doc = existing[0]
            if mode == "replace":
                db.collection("categories").document(doc.id).update({
                    "keywords": keywords
                })
            else:  # sync 模式
                data = doc.to_dict()
                current_keywords = set(data.get("keywords", []))
                new_keywords = set(keywords)
                merged_keywords = list(current_keywords.union(new_keywords))

                if merged_keywords != current_keywords:
                    db.collection("categories").document(doc.id).update({
                        "keywords": merged_keywords
                    })
        else:
            db.collection("categories").add({
                "name": name,
                "keywords": keywords
            })

    return jsonify({"message": "同步完成"}), 200

# 🧠 自動分類影片標題（根據分類關鍵字）
def categorize_title_by_keywords(title):
    categories_ref = db.collection("categories").stream()
    matched = []

    for doc in categories_ref:
        cat = doc.to_dict()
        name = cat.get("name")
        keywords = cat.get("keywords", [])
        for kw in keywords:
            if kw in title:
                matched.append(name)
                break

    return matched

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)