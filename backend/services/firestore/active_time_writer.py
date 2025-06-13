from datetime import datetime
import logging

def write_active_time_all_to_channel_index_batch(
    db,
    channel_id: str,
    slot_counter: list[int],  # [凌, 早, 午, 晚]
    total_count: int,
    updated_at: datetime
):
    try:
        # 從 batch_0 開始掃描所有 batch 文件
        batch_prefix = "channel_index_batch"
        batch_ids = [doc.id for doc in db.collection(batch_prefix).stream() if doc.id.startswith("batch_")]
        batch_ids.sort()  # 保證順序掃描（雖然順序不影響）

        for batch_id in batch_ids:
            doc_ref = db.collection(batch_prefix).document(batch_id)
            doc = doc_ref.get()
            if not doc.exists:
                continue

            data = doc.to_dict()
            channels = data.get("channels", [])
            for i, ch in enumerate(channels):
                if ch.get("channel_id") == channel_id:
                    # 準備新的 active_time_all 欄位
                    new_stat = {
                        "凌": slot_counter[0],
                        "早": slot_counter[1],
                        "午": slot_counter[2],
                        "晚": slot_counter[3],
                        "totalCount": total_count,
                        "updatedAt": updated_at
                    }

                    channels[i]["active_time_all"] = new_stat

                    # 寫回整個 channels 陣列
                    doc_ref.set({
                        "channels": channels,
                    }, merge=True)

                    logging.info(f"📝 成功寫入 active_time_all → {channel_id}（位於 {batch_id}, index={i}）")
                    return

        logging.warning(f"❗ 找不到符合的 channel_id：{channel_id}，無法寫入 active_time_all")

    except Exception as e:
        logging.error(f"🔥 寫入 active_time_all 失敗（{channel_id}）：{e}")
