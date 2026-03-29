# services/firestore/auth_service.py

import logging

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore

from utils.kms_crypto import kms_decrypt, kms_encrypt


def save_channel_auth(db, channel_id: str, refresh_token: str):
    try:
        doc_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("channel_info")
            .document("meta")
        )
        encrypted_token = kms_encrypt(refresh_token)
        doc_ref.set(
            {
                "refresh_token": encrypted_token,
                "authorized_at": firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )
        logging.info(f"[Auth] ✅ 授權資料已儲存（已加密）：channel_id={channel_id}")
    except GoogleAPIError as e:
        logging.error(f"[Auth] ❌ Firestore 寫入失敗：{e}")
        raise


def get_refresh_token(db, channel_id: str) -> str | None:
    """
    讀取已授權頻道的 refresh_token。
    自動處理 KMS 解密，並向下相容未加密的舊資料。
    如果不存在或發生錯誤則回傳 None。
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

        raw_token = doc.to_dict().get("refresh_token")
        if not raw_token:
            logging.warning(f"[Auth] ⚠️ refresh_token 欄位為空：channel_id={channel_id}")
            return None

        token = kms_decrypt(raw_token)
        logging.info(f"[Auth] ✅ 成功取得 refresh_token：channel_id={channel_id}")
        return token

    except GoogleAPIError:
        logging.exception(f"[Auth] ❌ Firestore 讀取失敗：channel_id={channel_id}")
        return None

    except (KeyError, AttributeError):
        logging.exception(f"[Auth] ❌ 資料存取錯誤：channel_id={channel_id}")
        return None
