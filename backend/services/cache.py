
import logging
from services.youtube.fetcher import get_video_data
from utils.categorizer import match_category_and_game
from utils.youtube_utils import normalize_video_item

def refresh_video_cache(db, channel_id: str, date_ranges=None):
    try:
        # 取得設定資料
        settings_ref = db.collection("channel_data").document(channel_id).collection("settings").document("config")
        settings_doc = settings_ref.get()
        if not settings_doc.exists:
            logging.warning("⚠️ [refresh_video_cache] 無法找到分類設定 config")
            return []

        settings = settings_doc.to_dict()
        raw_items = get_video_data(date_ranges=date_ranges)

        saved_videos = []

        for raw_item in raw_items:
            item = normalize_video_item(raw_item)
            if not item:
                continue  # 正規化失敗的略過

            video_id = item.get("videoId")
            title = item.get("title")
            publish_date = item.get("publishDate")
            duration = item.get("duration")
            video_type = item.get("type")

            if not all([video_id, title, publish_date, video_type]):
                logging.warning("⚠️ [refresh_video_cache] 略過資料不完整影片: %s", item)
                continue

            result = match_category_and_game(title, video_type, settings)

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

            video_ref = db.collection("channel_data").document(channel_id).collection("videos").document(video_id)
            video_ref.set(video_data)
            saved_videos.append(video_data)

        logging.info("✅ [refresh_video_cache] 寫入完成，共 %d 筆", len(saved_videos))
        return saved_videos

    except Exception as e:
        logging.error("🔥 [refresh_video_cache] 快取更新錯誤", exc_info=True)
        return []
