# services/live_redirect/video_classifier.py

import logging
from datetime import datetime, timedelta

from google.cloud.firestore import Client

CHANNEL_INDEX_COLLECTION = "channel_index"


def classify_video(db: Client, item: dict, now: datetime) -> dict | None:
    video_id = item.get("id")
    snippet = item.get("snippet", {})
    status = item.get("status", {})
    live_details = item.get("liveStreamingDetails", {})
    channel_id = snippet.get("channelId")

    if not live_details:
        logging.info(f"🟡 {video_id} 不是直播影片，略過")
        return None

    actual_start = live_details.get("actualStartTime")
    scheduled_start = live_details.get("scheduledStartTime")
    actual_end = live_details.get("actualEndTime")
    privacy = status.get("privacyStatus")

    # 處理 startTime 判斷邏輯
    is_upcoming = False
    start_time = None

    if actual_end:
        # 🎯 情境 1：已結束的直播（無論是公開或私人）
        start_time = actual_start or scheduled_start

    elif actual_start and datetime.fromisoformat(actual_start) <= now:
        # 🎯 情境 2：直播中（已開始但尚未結束）
        start_time = actual_start

    elif scheduled_start:
        # 🎯 情境 3：尚未開播的直播預約
        sched_time = datetime.fromisoformat(scheduled_start)
        start_time = scheduled_start

        if sched_time > now + timedelta(minutes=15):
            # 🔄 情境 3-1：預約時間延後超過15分鐘，但仍保留於快取
            logging.info(f"📌 預約時間超過15分鐘，仍寫入快取：{video_id} / startTime={start_time}")
            is_upcoming = True

        elif now - sched_time > timedelta(minutes=15):
            # ❌ 情境 3-2：預約時間已過15分鐘仍未開播（過期待機室）
            logging.warning(f"⏰ 過期待機室，略過：{video_id}")
            return None

        else:
            # ✅ 情境 3-3：即將開播的正常預約直播
            is_upcoming = True

    # 🔹 判斷 endTime（若影片為 private/unlisted 且抓不到 actualEndTime）
    end_time = actual_end
    if not actual_end and privacy in ("private", "unlisted"):
        end_time = now.isoformat()
        logging.info(f"📴 偵測已收播私人影片，補 endTime={end_time}：{video_id}")

    # 🔍 查頻道資訊
    channel_doc = db.collection(CHANNEL_INDEX_COLLECTION).document(channel_id).get()
    if not channel_doc.exists:  # type: ignore[union-attr]
        logging.warning(f"❗ 找不到頻道資料：{channel_id}")
        return None

    channel = channel_doc.to_dict() or {}  # type: ignore[union-attr]
    viewers = (
        int(live_details.get("concurrentViewers", "0"))
        if "concurrentViewers" in live_details
        else 0
    )

    return {
        "channel_id": channel_id,
        "name": channel.get("name"),
        "thumbnail": channel.get("thumbnail"),
        "badge": channel.get("badge"),
        "countryCode": channel.get("countryCode", []),
        "live": {
            "videoId": video_id,
            "title": snippet.get("title"),
            "startTime": start_time,
            "viewers": viewers,
            "isUpcoming": is_upcoming,
            "endTime": end_time,
        },
    }
