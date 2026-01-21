from typing import Dict, Optional
from google.cloud import firestore
from google.oauth2 import service_account
import os

from core.constants import get_firebase_key_path

def init_firestore_client() -> firestore.Client:
    """
    初始化 Firestore 客戶端，根據環境變數選擇資料庫

    環境變數:
        FIRESTORE_DATABASE: 資料庫名稱 (預設: "(default)")
    """
    credentials = service_account.Credentials.from_service_account_file(get_firebase_key_path())
    database_id = os.getenv("FIRESTORE_DATABASE", "(default)")
    return firestore.Client(credentials=credentials, project=credentials.project_id, database=database_id)

def needs_update_info(existing: Optional[Dict], new: Dict) -> bool:
    if not existing:
        return True
    return (
        existing.get("name") != new["name"]
        or existing.get("thumbnail") != new["thumbnail"]
        or existing.get("url") != new["url"]
    )
