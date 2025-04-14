from flask import Flask
print("✅ [app.py] Flask app module loaded")
from flask_cors import CORS
import logging
import os
import traceback
from firebase_admin import firestore

from services.firebase import init_firestore
from routes.base_routes import init_base_routes
from routes.cache_routes import init_cache_routes
from routes.category_routes import init_category_routes
print("✅ 準備載入 cache_channel_videos")
from routes.cache_channel_videos import init_cache_v2_routes

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
print("✅ [app.py] Flask app created")
CORS(app)

# 初始化 Firebase，加入錯誤處理
try:
    db = init_firestore()
except Exception:
    logging.error("🔥 初始化 Firebase 失敗，服務無法啟動", exc_info=True)
    raise  # 或可視情況改為：sys.exit(1)

# 初始化各路由模組
init_base_routes(app)
init_cache_routes(app, db)
init_category_routes(app, db)
print("✅ [app.py] Registering cache v2 routes")
init_cache_v2_routes(app)

@app.route("/test-firestore")
def test_firestore():
    try:
        print("🚀 [test-firestore] 開始初始化 Firebase")
        db = init_firestore()
        print("✅ [test-firestore] Firebase 初始化成功")
        print("🧪 db 實體建立成功：", isinstance(db, firestore.Client))

        collection_ref = db.collection("test")
        print("📌 collection 物件：", collection_ref)

        doc_ref = collection_ref.document("ping")
        print("📌 document 物件：", doc_ref)

        doc_ref.set({"hello": "world"})
        print("✅ [test-firestore] 寫入成功🦆")
        return "✅ Firestore 測試寫入成功🦆"

    except Exception as e:
        import traceback
        logging.error("🔥 Firestore 測試失敗：%s", traceback.format_exc())
        logging.error("❗錯誤類型：%s", type(e).__name__)
        logging.error("❗錯誤訊息：%s", str(e))
        return (
            f"<h1>❌ Firestore 測試失敗</h1><pre>{traceback.format_exc()}</pre>",
            500,
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
