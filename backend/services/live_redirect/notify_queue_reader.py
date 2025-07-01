# services/live_redirect/notify_queue_reader.py

import logging
from datetime import timedelta
from google.cloud.firestore import Client

def get_pending_video_ids(db: Client, force: bool, now) -> list[dict]:
    today_str = now.date().isoformat()
    yesterday_str = (now - timedelta(days=1)).date().isoformat()
    video_map = {}

    for date_str in [yesterday_str, today_str]:
        doc = db.collection("live_redirect_notify_queue").document(date_str).get()
        data = doc.to_dict() or {}
        videos = data.get("videos", [])

        for v in videos:
            video_id = v.get("videoId")
            if not video_id:
                continue

            if not force and v.get("processedAt"):
                continue

            # 以 videoId 去重複，保留 notifiedAt 較新者
            prev = video_map.get(video_id)
            if not prev or v.get("notifiedAt", "") > prev.get("notifiedAt", ""):
                video_map[video_id] = v

    video_ids = list(video_map.keys())
    logging.info(f"🎯 第一階段完成：{len(video_ids)} 支待查影片")
    logging.info(f"📋 影片ID列表：{video_ids}")
    return list(video_map.values())
