import logging
from typing import Dict
from google.cloud.firestore import Client

def write_category_counts_to_channel_index_batch(
    db: Client,
    channel_id: str,
    counts: Dict[str, int]
) -> None:
    """
    寫入 category_counts 至 channel_index_batch 中對應的頻道資料。
    - 對所有 batch_* 文件逐一掃描 channels 陣列
    - 找到對應 channel_id 後更新該元素的 category_counts 欄位
    """
    try:
        batch_prefix = "channel_index_batch"
        batch_docs = db.collection(batch_prefix).stream()
        batch_ids = sorted([doc.id for doc in batch_docs if doc.id.startswith("batch_")])

        for batch_id in batch_ids:
            doc_ref = db.collection(batch_prefix).document(batch_id)
            doc = doc_ref.get()
            if not doc.exists:
                continue

            data = doc.to_dict()
            channels = data.get("channels", [])
            for i, ch in enumerate(channels):
                if ch.get("channel_id") == channel_id:
                    channels[i]["category_counts"] = counts

                    doc_ref.set({
                        "channels": channels
                    }, merge=True)

                    logging.info(f"📊 成功寫入 category_counts → {channel_id}（位於 {batch_id}, index={i}）")
                    return

        logging.warning(f"❗ 找不到符合的 channel_id：{channel_id}，無法寫入 category_counts")

    except Exception as e:
        logging.error(f"🔥 寫入 category_counts 失敗（{channel_id}）：{e}", exc_info=True)
