
import logging
from services.youtube.fetcher import get_video_data
from utils.categorizer import match_category_and_game

def refresh_video_cache(db, channel_id: str, date_ranges=None):
    try:
        # 取得設定資料
        settings_ref = db.collection("channel_data").document(channel_id).collection("settings").document("config")
        settings_doc = settings_ref.get()
        if not settings_doc.exists:
            logging.warning("⚠️ [refresh_video_cache] 無法找到分類設定 config")
            return
        settings = settings_doc.to_dict()

        # 抓取影片資料
        fetched_data = get_video_data(date_ranges=date_ranges)
        for item in fetched_data:
            video_id = item.get("videoId")
            title = item.get("title")
            publish_date = item.get("publishDate")
            duration = item.get("duration")
            video_type = item.get("type")

            if not all([video_id, title, publish_date, video_type]):
                logging.warning("⚠️ [refresh_video_cache] 略過資料不完整影片: %s", item)
                continue

            # 執行分類
            result = match_category_and_game(title, video_type, settings)

            # 整合資料格式
            video_data = {
                "videoId": video_id,
                "title": title,
                "publishDate": publish_date,
                "duration": duration,
                "type": video_type,
                "matchedCategories": result["matchedCategories"],
                "game": result["game"],
                "matchedKeywords": result["matchedKeywords"]
            }

            # 寫入 Firestore：channel_data/{channel_id}/videos/{videoId}
            video_ref = db.collection("channel_data").document(channel_id).collection("videos").document(video_id)
            video_ref.set(video_data)

        logging.info("✅ [refresh_video_cache] 已成功更新 %d 部影片", len(fetched_data))

    except Exception as e:
        logging.error("🔥 [refresh_video_cache] 快取更新錯誤", exc_info=True)
