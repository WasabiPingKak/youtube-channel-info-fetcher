import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from google.api_core.exceptions import GoogleAPIError
from google.cloud.firestore import Client

from .firestore_date_utils import parse_firestore_date

logger = logging.getLogger(__name__)


def get_active_channels(db: Client) -> list[dict[str, Any]]:
    try:
        logger.info("🔍 嘗試載入 channel_sync_index/index_list")
        doc = db.collection("channel_sync_index").document("index_list").get()
        if not doc.exists:
            logger.warning("⚠️ 無 index_list 文件，無法取得活躍頻道")
            return []

        items = doc.to_dict().get("channels", [])
        logger.info("📋 總頻道數量：%d", len(items))

        # 🔽 收集所有 disabled 的 channel_id
        disabled_ids: set[str] = set()
        batch_docs = db.collection("channel_index_batch").stream()
        for batch_doc in batch_docs:
            batch_data = batch_doc.to_dict()
            for ch in batch_data.get("channels", []):
                if not ch.get("enabled", True):  # 預設為 True，僅在明確為 False 時加入排除
                    disabled_ids.add(ch.get("channel_id"))
        logger.info("🚫 被停用頻道數量：%d", len(disabled_ids))

        now = datetime.now(UTC)
        threshold_30d = now - timedelta(days=30)
        threshold_7d = now - timedelta(days=7)

        active = []
        for item in items:
            channel_id = item.get("channel_id")
            if channel_id in disabled_ids:
                logger.debug("⏩ 已停用頻道 %s，略過", channel_id)
                continue

            raw_sync = item.get("lastVideoSyncAt")
            raw_check = item.get("lastCheckedAt")
            sync_time = parse_firestore_date(raw_sync)
            check_time = parse_firestore_date(raw_check)

            logger.debug("🔎 頻道 %s", channel_id)
            logger.debug("    lastVideoSyncAt: %s → %s", raw_sync, sync_time)
            logger.debug("    lastCheckedAt:   %s → %s", raw_check, check_time)

            match = False
            if sync_time and sync_time >= threshold_30d:
                logger.debug("    ✅ 命中條件：lastVideoSyncAt 在 30 天內")
                match = True
            elif check_time and check_time >= threshold_7d:
                logger.debug("    ✅ 命中條件：lastCheckedAt 在 7 天內")
                match = True

            if match:
                active.append(item)
            else:
                logger.debug("    ❌ 不符合活躍條件")

        logger.info("✅ 篩選後活躍頻道數量：%d", len(active))
        return active

    except GoogleAPIError as e:
        logger.error("❌ 讀取活躍頻道失敗: %s", e, exc_info=True)
        return []
