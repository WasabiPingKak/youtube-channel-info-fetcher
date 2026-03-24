import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

def init_firestore():
    """
    初始化 Firestore 客戶端，根據環境變數選擇資料庫

    環境變數:
        FIRESTORE_DATABASE: 資料庫名稱 (預設: "(default)")
        GOOGLE_APPLICATION_CREDENTIALS: 服務帳號金鑰路徑

    Returns:
        firestore.Client: Firestore 客戶端實例
    """
    # 讀取環境變數
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-key.json")
    database_id = os.getenv("FIRESTORE_DATABASE", "(default)")

    try:
        print("📂 目前工作目錄內容：", os.listdir("."))
        print(f"📁 是否有 {path}：", os.path.exists(path))
        print("🌍 GOOGLE_CLOUD_PROJECT =", os.getenv("GOOGLE_CLOUD_PROJECT"))
        print("🌍 GOOGLE_APPLICATION_CREDENTIALS =", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
        print("🌍 FIRESTORE_DATABASE =", database_id)
        print("🧪 DEPLOY_TAG =", os.getenv("DEPLOY_TAG"))

        if not os.path.exists(path):
            raise FileNotFoundError(f"❌ 找不到 {path}，請確認檔案是否存在")

        if not firebase_admin._apps:
            cred = credentials.Certificate(path)
            print("📨 Firebase 使用者：", cred.service_account_email)
            print("🔎 Firebase 金鑰專案 ID：", cred.project_id)
            print("✅ [firebase.py] Initializing Firebase app")
            firebase_admin.initialize_app(cred)
            logging.info("✅ Firebase Admin 初始化成功")

        print(f"✅ [firebase.py] Initializing Firestore client (database: {database_id})")
        db = firestore.client(database_id=database_id)
        print(f"🧩 Firestore client 建立完成 (database: {database_id})")
        logging.info(f"✅ Firestore 客戶端連線至資料庫: {database_id}")
        return db

    except Exception:
        logging.error("🔥 [init_firestore] 初始化 Firebase 時發生錯誤", exc_info=True)
        raise
