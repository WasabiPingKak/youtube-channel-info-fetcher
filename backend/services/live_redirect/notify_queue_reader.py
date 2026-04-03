# services/live_redirect/notify_queue_reader.py

import logging
from datetime import timedelta

from google.cloud.firestore import Client

NEW_COLLECTION = "live_redirect_notifications"
OLD_COLLECTION = "live_redirect_notify_queue"


def get_pending_video_ids(db: Client, force: bool, now) -> list[dict]:
    today_str = now.date().isoformat()
    yesterday_str = (now - timedelta(days=1)).date().isoformat()
    video_map: dict[str, dict] = {}

    # 從新 collection 讀取（獨立 document，用 date 欄位篩選）
    for date_str in [yesterday_str, today_str]:
        docs = db.collection(NEW_COLLECTION).where("date", "==", date_str).stream()
        for doc in docs:
            v = doc.to_dict() or {}
            video_id = v.get("videoId")
            if not video_id:
                continue
            if not force and v.get("processedAt"):
                continue
            prev = video_map.get(video_id)
            if not prev or v.get("notifiedAt", "") > prev.get("notifiedAt", ""):
                video_map[video_id] = v

    # 向後相容：讀取舊 collection 中未處理的通知（過渡期後移除）
    for date_str in [yesterday_str, today_str]:
        doc = db.collection(OLD_COLLECTION).document(date_str).get()  # type: ignore[assignment]
        data = doc.to_dict() or {}  # type: ignore[union-attr]
        for v in data.get("videos", []):
            video_id = v.get("videoId")
            if not video_id:
                continue
            if not force and v.get("processedAt"):
                continue
            # 新 collection 已有的以新為準，不覆蓋
            if video_id in video_map:
                continue
            video_map[video_id] = v

    video_ids = list(video_map.keys())
    logging.info(f"🎯 第一階段完成：{len(video_ids)} 支待查影片")
    logging.info(f"📋 影片ID列表：{video_ids}")
    return list(video_map.values())
