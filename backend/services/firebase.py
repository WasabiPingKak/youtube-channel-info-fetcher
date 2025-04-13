import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

def init_firestore():
    # ✅ 讀取環境變數指定的金鑰路徑（預設為 firebase-key.json）
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-key.json")

    try:
        print("📂 目前工作目錄內容：", os.listdir("."))
        print(f"📁 是否有 {path}：", os.path.exists(path))
        print("🌍 GOOGLE_CLOUD_PROJECT =", os.getenv("GOOGLE_CLOUD_PROJECT"))
        print("🌍 GOOGLE_APPLICATION_CREDENTIALS =", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
        print("🧪 DEPLOY_TAG =", os.getenv("DEPLOY_TAG"))

        if not os.path.exists(path):
            raise FileNotFoundError(f"❌ 找不到 {path}，請確認檔案是否存在")

        if not firebase_admin._apps:
            cred = credentials.Certificate(path)
            print("📨 Firebase 使用者：", cred.service_account_email)
            print("🔎 Firebase 金鑰專案 ID：", cred.project_id)
            firebase_admin.initialize_app(cred)
            logging.info("✅ Firebase Admin 初始化成功")

        db = firestore.client()
        print("🧩 Firestore client 建立完成：", db)
        return db

    except Exception:
        logging.error("🔥 [init_firestore] 初始化 Firebase 時發生錯誤", exc_info=True)
        raise
