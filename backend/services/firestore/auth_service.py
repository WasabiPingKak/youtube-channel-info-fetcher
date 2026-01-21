# services/firestore/auth_service.py

from google.cloud import firestore
from google.api_core.exceptions import GoogleAPIError
import logging
from services.firestore_client import get_firestore_client

db = get_firestore_client()

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


def get_refresh_token(channel_id: str) -> str | None:
    """
    讀取已授權頻道的 refresh_token。如果不存在或發生錯誤則回傳 None。
    """
    try:
        doc_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("channel_info")
            .document("meta")
        )
        doc = doc_ref.get()
        if not doc.exists:
            logging.warning(f"[Auth] ❌ 找不到 refresh_token：channel_id={channel_id}")
            return None

        token = doc.to_dict().get("refresh_token")
        if not token:
            logging.warning(f"[Auth] ⚠️ refresh_token 欄位為空：channel_id={channel_id}")
        else:
            logging.info(f"[Auth] ✅ 成功取得 refresh_token：channel_id={channel_id}")

        return token

    except GoogleAPIError as e:
        logging.exception(f"[Auth] ❌ Firestore 讀取失敗：channel_id={channel_id}")
        return None

    except Exception as e:
        logging.exception(f"[Auth] ❌ 發生未知錯誤：channel_id={channel_id}")
        return None
