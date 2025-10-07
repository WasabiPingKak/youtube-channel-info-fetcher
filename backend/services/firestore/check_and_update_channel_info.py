import logging
from google.cloud.firestore import Client
from services.youtube.channel_info_fetcher import fetch_channel_basic_info

logger = logging.getLogger(__name__)


def check_and_update_channel_info(db: Client, channel_id: str, batch_id: str) -> None:
    try:
        # 🔍 抓取最新資料
        latest = fetch_channel_basic_info(channel_id)
        new_name = latest.get("name", "").strip()
        new_thumbnail = latest.get("thumbnail", "").strip()

        # 🧩 準備三個路徑
        index_ref = db.collection("channel_index").document(channel_id)
        batch_ref = db.collection("channel_index_batch").document(batch_id)
        info_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("channel_info")
            .document("info")
        )

        # 📥 讀取現有資料（若不存在則為空）
        index_doc = index_ref.get().to_dict() or {}
        batch_doc = batch_ref.get().to_dict() or {}
        info_doc = info_ref.get().to_dict() or {}

        # 🔍 從 batch 陣列中找出該頻道資料
        batch_channels = batch_doc.get("channels", [])
        batch_entry = next(
            (ch for ch in batch_channels if ch.get("channel_id") == channel_id), None
        )
        if batch_entry is None:
            logger.warning(
                f"⚠️ batch_id {batch_id} 中找不到頻道 {channel_id}，略過寫入該處"
            )

        # 🧠 比對邏輯
        old_name = index_doc.get("name") or ""
        old_thumbnail = index_doc.get("thumbnail") or ""
        name_changed = new_name and new_name != old_name
        thumbnail_changed = new_thumbnail and new_thumbnail != old_thumbnail
        updated = name_changed or thumbnail_changed

        if not updated:
            logger.info(f"🔍 頻道 {channel_id} 無名稱或頭像變更")
            return

        # 📝 寫入更新值（保護性邏輯：空字串不覆蓋）
        if name_changed:
            index_doc["name"] = new_name
            if batch_entry is not None:
                batch_entry["name"] = new_name
            info_doc["name"] = new_name
        if thumbnail_changed:
            index_doc["thumbnail"] = new_thumbnail
            if batch_entry is not None:
                batch_entry["thumbnail"] = new_thumbnail
            info_doc["thumbnail"] = new_thumbnail

        # ✅ 寫入三處（不存在也會自動建立）
        index_ref.set(index_doc)
        info_ref.set(info_doc)
        if batch_entry is not None:
            batch_ref.update({"channels": batch_channels})  # 整體回寫陣列

        # 🖨️ Log 更新結果
        logger.info(
            f"🖼️ 頻道 {channel_id} 名稱或頭像異動，已更新 Firestore\n"
            f"    - 名稱：原「{old_name}」→ 新「{new_name}」\n"
            f"    - 頭像：原「{old_thumbnail}」→ 新「{new_thumbnail}」"
        )

    except Exception as e:
        logger.warning(f"⚠️ 頻道 {channel_id} 同步名稱與頭像失敗：{e}", exc_info=True)
