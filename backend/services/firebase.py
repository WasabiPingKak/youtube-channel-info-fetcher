import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

def init_firestore():
    path = "firebase-key.json"
    try:
        if not os.path.exists(path):
            raise FileNotFoundError("❌ 找不到 firebase-key.json，請確認檔案是否存在")

        if not firebase_admin._apps:
            cred = credentials.Certificate(path)
            firebase_admin.initialize_app(cred)
            logging.info("✅ Firebase Admin 初始化成功")
        return firestore.client()
    except Exception:
        logging.error("🔥 [init_firestore] 初始化 Firebase 時發生錯誤", exc_info=True)
        raise  # 繼續往上拋出例外，讓主程式知道初始化失敗
