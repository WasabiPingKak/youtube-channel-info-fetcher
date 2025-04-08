import logging
from youtube_fetcher import get_video_data

def get_latest_cache(db):
    try:
        doc = db.collection("videos").document("latest").get()
        return doc.to_dict().get("data", []) if doc.exists else []
    except Exception as e:
        logging.error("🔥 [get_latest_cache] 取得最新快取時發生錯誤", exc_info=True)
        return []

def refresh_video_cache(db, date_ranges=None):
    try:
        new_data = get_video_data(date_ranges=date_ranges)
    except Exception as e:
        logging.error("🔥 [refresh_video_cache] 取得新影片資料時發生錯誤", exc_info=True)
        new_data = []

    try:
        old_data = get_latest_cache(db)
        combined = {v["videoId"]: v for v in old_data}
        for item in new_data:
            combined[item["videoId"]] = item
        merged_data = list(combined.values())
        db.collection("videos").document("latest").set({"data": merged_data})
        return merged_data, new_data
    except Exception as e:
        logging.error("🔥 [refresh_video_cache] 合併快取資料或儲存時發生錯誤", exc_info=True)
        return [], new_data

def overwrite_video_cache(db, date_ranges):
    try:
        new_data = get_video_data(date_ranges=date_ranges)
        db.collection("videos").document("latest").set({"data": new_data})
        return new_data
    except Exception as e:
        logging.error("🔥 [overwrite_video_cache] 取得或儲存資料時發生錯誤", exc_info=True)
        return []
