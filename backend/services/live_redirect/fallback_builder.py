# services/live_redirect/fallback_builder.py

from datetime import datetime

def build_fallback_entry(video_id: str, now: datetime) -> dict:
    """
    回傳一個無法存取影片的 fallback 快取資料（如已刪除或隱私）。

    Args:
        video_id (str): 影片 ID
        now (datetime): 當前 UTC 時間

    Returns:
        dict: fallback 快取資料結構
    """
    return {
        "channel_id": None,
        "name": None,
        "thumbnail": None,
        "badge": None,
        "countryCode": [],
        "live": {
            "videoId": video_id,
            "title": None,
            "startTime": None,
            "viewers": 0,
            "isUpcoming": False,
            "endTime": now.isoformat(),
            "isAvailable": False
        }
    }
