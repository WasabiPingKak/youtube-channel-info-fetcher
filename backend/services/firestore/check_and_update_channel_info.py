import logging

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore
from google.cloud.firestore import Client
from googleapiclient.errors import HttpError

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

        # 使用 Transaction 確保讀寫一致性（batch write 僅保證原子寫入，不保證讀寫隔離）
        @firestore.transactional
        def _update_in_transaction(transaction):
            index_doc = index_ref.get(transaction=transaction).to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
            batch_doc = batch_ref.get(transaction=transaction).to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
            info_doc = info_ref.get(transaction=transaction).to_dict() or {}

            batch_channels = batch_doc.get("channels", [])
            batch_entry = next(
                (ch for ch in batch_channels if ch.get("channel_id") == channel_id), None
            )
            if batch_entry is None:
                logger.warning(f"⚠️ batch_id {batch_id} 中找不到頻道 {channel_id}，略過寫入該處")

            old_name = index_doc.get("name") or ""
            old_thumbnail = index_doc.get("thumbnail") or ""
            name_changed = new_name and new_name != old_name
            thumbnail_changed = new_thumbnail and new_thumbnail != old_thumbnail

            if not (name_changed or thumbnail_changed):
                logger.info(f"🔍 頻道 {channel_id} 無名稱或頭像變更")
                return

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

            transaction.set(index_ref, index_doc)
            transaction.set(info_ref, info_doc)
            if batch_entry is not None:
                transaction.update(batch_ref, {"channels": batch_channels})

            logger.info(
                f"🖼️ 頻道 {channel_id} 名稱或頭像異動，已更新 Firestore\n"
                f"    - 名稱：原「{old_name}」→ 新「{new_name}」\n"
                f"    - 頭像：原「{old_thumbnail}」→ 新「{new_thumbnail}」"
            )

        transaction = db.transaction()
        _update_in_transaction(transaction)

    except (HttpError, GoogleAPIError) as e:
        logger.warning(f"⚠️ 頻道 {channel_id} 同步名稱與頭像失敗：{e}", exc_info=True)
