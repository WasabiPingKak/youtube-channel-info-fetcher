"""影片同步狀態檢查與更新 token 產生服務"""

import logging
import secrets
from datetime import UTC, datetime, timedelta

from google.cloud import firestore

logger = logging.getLogger(__name__)


def check_channel_update_status(db: firestore.Client, channel_id: str) -> dict:
    """檢查頻道影片同步狀態，必要時產生更新 token。

    讀取 channel_sync_index/index_list，判斷頻道是否超過 12 小時未同步，
    若需更新則產生短效 token 供 /api/videos/update 使用。

    Returns:
        包含 shouldUpdate、channelId、lastCheckedAt、lastVideoSyncAt 的 dict，
        若需更新另包含 updateToken。
    """
    index_ref = db.collection("channel_sync_index").document("index_list")
    doc = index_ref.get()
    now = datetime.now(UTC)
    now_iso = now.isoformat()

    last_checked_at = None
    last_video_sync_at = None
    should_update = False

    if not doc.exists:  # type: ignore[union-attr]
        logger.info(f"📄 [check-update] 尚未存在 index_list，初始化頻道 {channel_id}")
        index_ref.set(
            {
                "channels": [
                    {
                        "channel_id": channel_id,
                        "lastCheckedAt": now_iso,
                    }
                ]
            }
        )
        logger.info(
            f"📝 [check-update] 寫入 index_list：新增頻道 {channel_id}（僅設定 lastCheckedAt）"
        )
        should_update = True
    else:
        data = doc.to_dict() or {}  # type: ignore[union-attr]
        channels = data.get("channels", [])
        found = False
        for ch in channels:
            if ch.get("channel_id") == channel_id:
                last_checked_at = ch.get("lastCheckedAt")
                last_video_sync_at = ch.get("lastVideoSyncAt")
                found = True

                if not last_checked_at:
                    should_update = True
                    logger.info(f"🧭 [check-update] 頻道 {channel_id} 沒有 lastCheckedAt，需更新")
                else:
                    last_checked_dt = datetime.fromisoformat(last_checked_at)
                    delta = now - last_checked_dt
                    if delta > timedelta(hours=12):
                        should_update = True
                        logger.info(f"⏰ [check-update] 距離上次檢查已超過 {delta}，需更新")

                if should_update:
                    ch["lastCheckedAt"] = now_iso
                break

        if not found:
            logger.info(f"➕ [check-update] 頻道 {channel_id} 尚未在 index_list 中，加入新紀錄")
            channels.append(
                {
                    "channel_id": channel_id,
                    "lastCheckedAt": now_iso,
                }
            )
            logger.info(
                f"📝 [check-update] 寫入 index_list：新增頻道 {channel_id}（僅設定 lastCheckedAt）"
            )
            should_update = True

        index_ref.set({"channels": channels})
        logger.info(
            f"📦 [check-update] 寫入整份 channels 更新："
            f"頻道 {channel_id}，shouldUpdate = {should_update}"
        )

    response = {
        "shouldUpdate": should_update,
        "channelId": channel_id,
        "lastCheckedAt": now_iso if should_update else last_checked_at,
        "lastVideoSyncAt": last_video_sync_at,
    }

    if should_update:
        token = secrets.token_urlsafe(24)
        expires_at = (now + timedelta(minutes=2)).isoformat()
        update_token_ref = db.document(f"channel_data/{channel_id}/channel_info/update_token")
        update_token_ref.set({"token": token, "expiresAt": expires_at})
        logger.info(f"🔐 [check-update] 產生更新 token for {channel_id}，expiresAt = {expires_at}")
        response["updateToken"] = token

    return response
