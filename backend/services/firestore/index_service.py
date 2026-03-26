from google.api_core.exceptions import GoogleAPIError
import logging
import os

FIRESTORE_INDEX_COLLECTION = "channel_index"
_ADMIN_IDS_RAW = os.getenv("ADMIN_CHANNEL_IDS", "")
ADMIN_CHANNEL_IDS = {cid.strip() for cid in _ADMIN_IDS_RAW.split(",") if cid.strip()}

def write_channel_index(db, channel_id: str, name: str, thumbnail: str) -> None:
    """
    建立或更新 channel_index/{channel_id} 文件，若內容無變化則略過。
    """
    doc_ref = db.collection(FIRESTORE_INDEX_COLLECTION).document(channel_id)

    index_data = {
        "name": name,
        "thumbnail": thumbnail,
        "url": f"https://www.youtube.com/channel/{channel_id}",
        "enabled": True,
        "priority": 1 if channel_id in ADMIN_CHANNEL_IDS else 100,
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

    except (FileNotFoundError, ValueError) as e:
        logging.exception(f"[Index] ❌ 更新 index 過程發生錯誤：{channel_id}")
        raise
