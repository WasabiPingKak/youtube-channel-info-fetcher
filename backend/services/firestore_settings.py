import firebase_admin
from firebase_admin import credentials, firestore
import logging

# 初始化 Firestore（若尚未初始化，這邊可以加保護）
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

db = firestore.client()

def load_category_settings(channel_id: str):
    doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("config")
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None

def save_category_settings(channel_id: str, settings: dict) -> bool:
    try:
        doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("config")
        doc_ref.set(settings)  # 完整覆蓋設定
        logging.info(f"✅ 成功儲存分類設定 - channel_id: {channel_id}")
        return True
    except Exception:
        logging.exception("🔥 無法儲存分類設定")
        return False
