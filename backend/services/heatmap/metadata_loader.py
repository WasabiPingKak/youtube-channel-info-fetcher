import logging

def build_channel_metadata_lookup(db) -> dict:
    """
    從 Firestore 的 channel_index_batch 建立 channelId 對應 metadata 的查詢表

    回傳:
        dict[channel_id] -> {
            name: str,
            thumbnail: str,
            countryCode: List[str]
        }
    """
    lookup = {}
    try:
        batch_docs = db.collection("channel_index_batch").stream()
        for batch_doc in batch_docs:
            data = batch_doc.to_dict()
            for entry in data.get("channels", []):
                cid = entry.get("channel_id")
                if cid:
                    lookup[cid] = {
                        "name": entry.get("name"),
                        "thumbnail": entry.get("thumbnail"),
                        "countryCode": entry.get("countryCode", [])
                    }
        logging.info(f"🧾 從 channel_index_batch 建立 metadata lookup，共 {len(lookup)} 筆")
    except Exception as e:
        logging.error(f"🔥 無法讀取 channel_index_batch：{e}")
    return lookup
