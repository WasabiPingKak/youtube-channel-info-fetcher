import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

logger = logging.getLogger(__name__)

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
        logger.debug("目前工作目錄內容：%s", os.listdir("."))
        logger.debug("是否有 %s：%s", path, os.path.exists(path))
        logger.info("GOOGLE_CLOUD_PROJECT = %s", os.getenv("GOOGLE_CLOUD_PROJECT"))
        logger.info("FIRESTORE_DATABASE = %s", database_id)

        if not os.path.exists(path):
            raise FileNotFoundError(f"❌ 找不到 {path}，請確認檔案是否存在")

        if not firebase_admin._apps:
            cred = credentials.Certificate(path)
            logger.info("Firebase 使用者：%s", cred.service_account_email)
            logger.info("Firebase 金鑰專案 ID：%s", cred.project_id)
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase Admin 初始化成功")

        logger.info("Firestore client 連線中 (database: %s)", database_id)
        db = firestore.client(database_id=database_id)
        logger.info("✅ Firestore 客戶端連線至資料庫: %s", database_id)
        return db

    except Exception:
        logger.error("🔥 初始化 Firebase 時發生錯誤", exc_info=True)
        raise
