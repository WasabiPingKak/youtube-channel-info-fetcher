from typing import Dict
from google.cloud.firestore import Client

def load_channel_info_index(db: Client) -> Dict[str, Dict[str, str]]:
    """
    從 channel_index_batch/* 合併頻道資訊，回傳 channel_id 對應的 info dict。
    僅包含 enabled == True 的頻道。
    """
    result = {}
    batch_docs = db.collection("channel_index_batch").stream()
    for doc in batch_docs:
        data = doc.to_dict()
        channels = data.get("channels", [])
        for ch in channels:
            cid = ch.get("channel_id")
            if not cid or not ch.get("enabled", True):
                continue
            if cid not in result:
                result[cid] = {
                    "name": ch.get("name", ""),
                    "thumbnail": ch.get("thumbnail", ""),
                }
    return result
