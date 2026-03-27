import logging

from google.api_core.exceptions import GoogleAPIError


def load_category_settings(db, channel_id: str):
    doc_ref = (
        db.collection("channel_data").document(channel_id).collection("settings").document("config")
    )
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None


def save_category_settings(db, channel_id: str, settings: dict) -> bool:
    try:
        doc_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("settings")
            .document("config")
        )
        doc_ref.set(settings)  # 完整覆蓋設定
        logging.info(f"✅ 成功儲存分類設定 - channel_id: {channel_id}")
        return True
    except GoogleAPIError:
        logging.exception("🔥 無法儲存分類設定")
        return False
