import logging
from datetime import datetime

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore


@firestore.transactional
def _update_active_time_in_transaction(transaction, doc_ref, channel_id, new_stat) -> bool:
    """Transaction 內讀取 batch 文件並更新 active_time_all"""
    doc = doc_ref.get(transaction=transaction)
    if not doc.exists:
        return False

    data = doc.to_dict()
    channels = data.get("channels", [])
    for i, ch in enumerate(channels):
        if ch.get("channel_id") == channel_id:
            channels[i]["active_time_all"] = new_stat
            transaction.set(doc_ref, {"channels": channels}, merge=True)
            return True
    return False


def write_active_time_all_to_channel_index_batch(
    db,
    channel_id: str,
    slot_counter: list[int],  # [凌, 早, 午, 晚]
    total_count: int,
    updated_at: datetime,
) -> None:
    try:
        new_stat = {
            "凌": slot_counter[0],
            "早": slot_counter[1],
            "午": slot_counter[2],
            "晚": slot_counter[3],
            "totalCount": total_count,
            "updatedAt": updated_at,
        }

        batch_prefix = "channel_index_batch"
        batch_ids = [
            doc.id for doc in db.collection(batch_prefix).stream() if doc.id.startswith("batch_")
        ]
        batch_ids.sort()

        for batch_id in batch_ids:
            doc_ref = db.collection(batch_prefix).document(batch_id)
            transaction = db.transaction()
            if _update_active_time_in_transaction(transaction, doc_ref, channel_id, new_stat):
                logging.info(f"📝 成功寫入 active_time_all → {channel_id}（位於 {batch_id}）")
                return

        logging.warning(f"❗ 找不到符合的 channel_id：{channel_id}，無法寫入 active_time_all")

    except GoogleAPIError as e:
        logging.error(f"🔥 寫入 active_time_all 失敗（{channel_id}）：{e}")
