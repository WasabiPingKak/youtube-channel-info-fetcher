import logging
from services.youtube.fetcher import get_video_data

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
        combined = {v.get("影片ID"): v for v in old_data if v.get("影片ID")}
        for item in new_data:
            video_id = item.get("影片ID")
            if not video_id:
                logging.warning("⚠️ [refresh_video_cache] 缺少影片ID，略過此筆資料: %s", item)
                continue
            combined[video_id] = item
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
