import logging

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore
from google.cloud.firestore import Client


@firestore.transactional
def _update_category_counts_in_transaction(transaction, doc_ref, channel_id, counts):
    """Transaction 內讀取 batch 文件並更新 category_counts"""
    doc = doc_ref.get(transaction=transaction)
    if not doc.exists:
        return False

    data = doc.to_dict()
    channels = data.get("channels", [])
    for i, ch in enumerate(channels):
        if ch.get("channel_id") == channel_id:
            channels[i]["category_counts"] = counts
            transaction.set(doc_ref, {"channels": channels}, merge=True)
            return True
    return False


def write_category_counts_to_channel_index_batch(
    db: Client, channel_id: str, counts: dict[str, int]
) -> None:
    """
    寫入 category_counts 至 channel_index_batch 中對應的頻道資料。
    - 對所有 batch_* 文件逐一掃描 channels 陣列
    - 找到對應 channel_id 後以 Transaction 更新該元素的 category_counts 欄位
    """
    try:
        batch_prefix = "channel_index_batch"
        batch_docs = db.collection(batch_prefix).stream()
        batch_ids = sorted([doc.id for doc in batch_docs if doc.id.startswith("batch_")])

        for batch_id in batch_ids:
            doc_ref = db.collection(batch_prefix).document(batch_id)
            transaction = db.transaction()
            if _update_category_counts_in_transaction(transaction, doc_ref, channel_id, counts):
                logging.info(f"📊 成功寫入 category_counts → {channel_id}（位於 {batch_id}）")
                return

        logging.warning(f"❗ 找不到符合的 channel_id：{channel_id}，無法寫入 category_counts")

    except GoogleAPIError as e:
        logging.error(f"🔥 寫入 category_counts 失敗（{channel_id}）：{e}", exc_info=True)
