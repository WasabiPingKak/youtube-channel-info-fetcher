import firebase_admin
from firebase_admin import credentials, firestore

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
