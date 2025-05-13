from google.cloud import firestore
from google.api_core.exceptions import GoogleAPIError
import logging

db = firestore.Client()

FIRESTORE_INDEX_COLLECTION = "channel_index"
SPECIAL_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng"  # 可抽成設定

def write_channel_index(channel_id: str, name: str, thumbnail: str) -> None:
    """
    建立或更新 channel_index/{channel_id} 文件，若內容無變化則略過。
    """
    doc_ref = db.collection(FIRESTORE_INDEX_COLLECTION).document(channel_id)

    index_data = {
        "name": name,
        "thumbnail": thumbnail,
        "url": f"https://www.youtube.com/channel/{channel_id}",
        "enabled": True,
        "priority": 1 if channel_id == SPECIAL_CHANNEL_ID else 100,
    }

    try:
        snapshot = doc_ref.get()
        existing = snapshot.to_dict() if snapshot.exists else None

        if existing == index_data:
            logging.info(f"[Index] ✅ 資料無變化，略過更新：{channel_id}")
            return

        doc_ref.set(index_data)
        logging.info(f"[Index] ✅ 寫入 / 更新完成：{channel_id}")

    except GoogleAPIError:
        logging.exception(f"[Index] ❌ Firestore 存取失敗：{channel_id}")
        raise

    except Exception:
        logging.exception(f"[Index] ❌ 更新 index 過程發生錯誤：{channel_id}")
        raise
