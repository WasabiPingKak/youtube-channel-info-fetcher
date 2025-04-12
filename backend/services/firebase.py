
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

def init_firestore():
    path = "firebase-key.json"
    try:
        print("📂 目前工作目錄內容：", os.listdir("."))
        print("📁 是否有 firebase-key.json：", os.path.exists(path))
        print("🌍 GOOGLE_CLOUD_PROJECT =", os.getenv("GOOGLE_CLOUD_PROJECT"))

        if not os.path.exists(path):
            raise FileNotFoundError("❌ 找不到 firebase-key.json，請確認檔案是否存在")

        if not firebase_admin._apps:
            cred = credentials.Certificate(path)
            print("📨 Firebase 使用者：", cred.service_account_email)
            firebase_admin.initialize_app(cred, {
                "projectId": "vtuber-channel-analyzer"
            })
            logging.info("✅ Firebase Admin 初始化成功")

        return firestore.client()

    except Exception:
        logging.error("🔥 [init_firestore] 初始化 Firebase 時發生錯誤", exc_info=True)
        raise
