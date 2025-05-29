import logging
from typing import List, Dict, Optional
from google.cloud.firestore import Client
from dateutil.parser import parse

logger = logging.getLogger(__name__)

def get_last_video_sync_time(db: Client, channel_id: str):
    try:
        index_ref = db.collection("channel_sync_index").document("index_list")
        doc = index_ref.get()
        if not doc.exists:
            return None

        data = doc.to_dict()
        channels = data.get("channels", [])
        for ch in channels:
            if ch.get("channel_id") == channel_id:
                raw_sync = ch.get("lastVideoSyncAt")
                if isinstance(raw_sync, str):
                    return parse(raw_sync)
                elif hasattr(raw_sync, "to_datetime"):
                    return raw_sync.to_datetime()
        return None

    except Exception as e:
        logger.error("🔥 無法讀取 lastVideoSyncAt (新版 index): %s", e, exc_info=True)
        return None

def update_last_sync_time(db: Client, channel_id: str, new_videos: List[Dict]) -> Optional[str]:
    if not new_videos:
        logger.info("ℹ️ 無影片可更新 lastVideoSyncAt")
        return None

    try:
        latest = max(v["snippet"]["publishedAt"] for v in new_videos)

        index_ref = db.collection("channel_sync_index").document("index_list")
        doc = index_ref.get()

        if not doc.exists:
            # 文件不存在，初始化新清單
            index_ref.set({
                "channels": [{
                    "channel_id": channel_id,
                    "lastVideoSyncAt": latest
                }]
            })
            logger.info(f"🕒 [init] 建立 index_list 並加入 {channel_id}")
        else:
            data = doc.to_dict()
            channels = data.get("channels", [])

            found = False
            for c in channels:
                if c.get("channel_id") == channel_id:
                    c["lastVideoSyncAt"] = latest
                    found = True
                    break

            if not found:
                channels.append({
                    "channel_id": channel_id,
                    "lastVideoSyncAt": latest
                })
                logger.info(f"➕ [append] 新增頻道 {channel_id} 至 index_list")

            index_ref.set({"channels": channels})

        logger.info(f"🕒 更新 lastVideoSyncAt 為 {latest}")
        return latest

    except Exception as e:
        logger.warning("⚠️ 無法更新 lastVideoSyncAt: %s", e, exc_info=True)
        return None
