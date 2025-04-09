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
        # 取得舊的快取資料
        old_data = get_latest_cache(db)
        old_video_ids = {v.get("影片ID") for v in old_data if v.get("影片ID")}

        # 取得新資料，但只保留尚未快取過的影片
        fetched_data = get_video_data(date_ranges=date_ranges)
        new_data = []
        for item in fetched_data:
            video_id = item.get("影片ID")
            if not video_id:
                logging.warning("⚠️ [refresh_video_cache] 缺少影片ID，略過此筆資料: %s", item)
                continue
            if video_id not in old_video_ids:
                new_data.append(item)
            else:
                logging.info("ℹ️ [refresh_video_cache] 已存在快取中，略過影片ID: %s", video_id)

        # 合併資料
        combined = {v.get("影片ID"): v for v in old_data if v.get("影片ID")}
        for item in new_data:
            combined[item["影片ID"]] = item
        merged_data = list(combined.values())

        # 儲存合併後的資料
        db.collection("videos").document("latest").set({"data": merged_data})
        return merged_data, new_data

    except Exception as e:
        logging.error("🔥 [refresh_video_cache] 執行過程中發生錯誤", exc_info=True)
        return [], []

def overwrite_video_cache(db, date_ranges):
    try:
        new_data = get_video_data(date_ranges=date_ranges)
        db.collection("videos").document("latest").set({"data": new_data})
        return new_data
    except Exception as e:
        logging.error("🔥 [overwrite_video_cache] 取得或儲存資料時發生錯誤", exc_info=True)
        return []
