from typing import Dict, Optional
from google.cloud import firestore
from google.oauth2 import service_account

from core.constants import get_firebase_key_path

def init_firestore_client() -> firestore.Client:
    credentials = service_account.Credentials.from_service_account_file(get_firebase_key_path())
    return firestore.Client(credentials=credentials, project=credentials.project_id)

def needs_update_info(existing: Optional[Dict], new: Dict) -> bool:
    if not existing:
        return True
    return (
        existing.get("name") != new["name"]
        or existing.get("thumbnail") != new["thumbnail"]
        or existing.get("url") != new["url"]
    )
