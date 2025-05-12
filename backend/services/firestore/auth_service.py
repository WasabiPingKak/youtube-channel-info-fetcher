# services/firestore/auth_service.py

from google.cloud import firestore
from google.api_core.exceptions import GoogleAPIError
import logging

db = firestore.Client()

def save_channel_auth(channel_id: str, refresh_token: str):
    try:
        doc_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("channel_info")
            .document("meta")
        )
        doc_ref.set(
            {
                "refresh_token": refresh_token,
                "authorized_at": firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )
        logging.info(f"[Auth] ✅ 授權資料已儲存：channel_id={channel_id}")
    except GoogleAPIError as e:
        logging.error(f"[Auth] ❌ Firestore 寫入失敗：{e}")
        raise
