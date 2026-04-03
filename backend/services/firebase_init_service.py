import logging
import os

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import Client

logger = logging.getLogger(__name__)


def init_firestore() -> Client:
    """
    初始化 Firestore 客戶端，根據環境變數選擇資料庫

    Cloud Run 環境使用 Application Default Credentials（ADC），不需要 key file。
    本地開發時 fallback 到 firebase-key.json。

    環境變數:
        FIRESTORE_DATABASE: 資料庫名稱 (預設: "(default)")
        GOOGLE_APPLICATION_CREDENTIALS: 服務帳號金鑰路徑（本地開發用）

    Returns:
        firestore.Client: Firestore 客戶端實例
    """
    database_id = os.getenv("FIRESTORE_DATABASE", "(default)")

    try:
        logger.info("GOOGLE_CLOUD_PROJECT = %s", os.getenv("GOOGLE_CLOUD_PROJECT"))
        logger.info("FIRESTORE_DATABASE = %s", database_id)

        if not firebase_admin._apps:
            key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-key.json")

            if os.path.exists(key_path):
                # 本地開發：使用 service account key file
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
                logger.info("✅ Firebase Admin 初始化成功（使用 key file: %s）", key_path)
            else:
                # Cloud Run：使用 Application Default Credentials
                firebase_admin.initialize_app()
                logger.info("✅ Firebase Admin 初始化成功（使用 ADC）")

        logger.info("Firestore client 連線中 (database: %s)", database_id)
        db = firestore.client(database_id=database_id)
        logger.info("✅ Firestore 客戶端連線至資料庫: %s", database_id)
        return db  # type: ignore[no-any-return]

    except Exception:
        logger.error("🔥 初始化 Firebase 時發生錯誤", exc_info=True)
        raise
