from flask import Flask
from flask_cors import CORS
import logging
import os

from services.firebase import init_firestore
from routes.base_routes import init_base_routes
from routes.cache_routes import init_cache_routes
from routes.category_routes import init_category_routes

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app, origins=["https://vtuber-channel-analyzer.web.app"])

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
