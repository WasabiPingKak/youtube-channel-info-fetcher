import logging
from datetime import datetime, timedelta, date, timezone
from typing import List, Dict, Any

from google.cloud.firestore import Client

logger = logging.getLogger(__name__)

def document_exists(db: Client, path: str) -> bool:
    try:
        parts = path.split("/")
        doc_ref = db.collection(parts[0])
        for i in range(1, len(parts) - 1, 2):
            doc_ref = doc_ref.document(parts[i]).collection(parts[i + 1])
        doc = doc_ref.document(parts[-1]).get()
        return doc.exists
    except Exception as e:
        logger.warning("⚠️ 無法檢查文件是否存在 [%s]: %s", path, e)
        return False


def write_document(db: Client, path: str, data: dict):
    try:
        parts = path.split("/")
        doc_ref = db.collection(parts[0])
        for i in range(1, len(parts) - 1, 2):
            doc_ref = doc_ref.document(parts[i]).collection(parts[i + 1])
        doc_ref.document(parts[-1]).set(data)
    except Exception as e:
        logger.error("❌ 寫入文件失敗 [%s]: %s", path, e, exc_info=True)

def get_active_channels(db: Client) -> List[Dict[str, Any]]:
    try:
        logger.info("🔍 嘗試載入 channel_sync_index/index_list")
        doc = db.collection("channel_sync_index").document("index_list").get()
        if not doc.exists:
            logger.warning("⚠️ 無 index_list 文件，無法取得活躍頻道")
            return []

        items = doc.to_dict().get("channels", [])
        logger.info("📋 總頻道數量：%d", len(items))

        now = datetime.now(timezone.utc)
        threshold_30d = now - timedelta(days=30)
        threshold_7d = now - timedelta(days=7)


        active = []
        for item in items:
            channel_id = item.get("channel_id")
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

    except Exception as e:
        logger.error("❌ 讀取活躍頻道失敗: %s", e, exc_info=True)
        return []


def load_videos_for_date(db: Client, channel_id: str, target_date: date) -> List[Dict[str, Any]]:
    try:
        videos = []
        batch_ref = db.collection("channel_data").document(channel_id).collection("videos_batch")
        docs = batch_ref.stream()

        for doc in docs:
            items = doc.to_dict().get("videos", [])
            for video in items:
                publish_date = parse_firestore_date(video.get("publishDate"))
                if publish_date and publish_date.date() == target_date:
                    videos.append(video)

        return videos
    except Exception as e:
        logger.warning("⚠️ 載入影片失敗 [%s]: %s", channel_id, e)
        return []


def parse_firestore_date(raw) -> datetime | None:
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    elif hasattr(raw, "to_datetime"):
        return raw.to_datetime()
    return None
