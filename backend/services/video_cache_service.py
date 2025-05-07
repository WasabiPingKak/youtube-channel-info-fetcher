import logging
from datetime import datetime, timezone
from google.cloud import firestore
from services.youtube.fetcher import get_video_data
from utils.categorizer import match_category_and_game
from utils.youtube_utils import normalize_video_item
from dateutil.parser import parse

# ✅ 抽出類型映射表，供多個函式共用
type_map = {
    "直播檔": "live",
    "直播": "live",
    "影片": "videos",
    "Shorts": "shorts",
    "shorts": "shorts"
}

def refresh_video_cache(db, channel_id: str, date_ranges=None):
    try:
        # 取得設定資料
        settings_ref = db.collection("channel_data").document(channel_id).collection("settings").document("config")
        settings_doc = settings_ref.get()
        if not settings_doc.exists:
            logging.warning("⚠️ [refresh_video_cache] 無法找到分類設定 config")
            return []

        settings = settings_doc.to_dict()
        logging.debug(f"🛠️ [DEBUG] 讀到設定欄位：{list(settings.keys())}")

        raw_items = get_video_data(date_ranges=date_ranges, input_channel=channel_id)
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

            type_for_setting = type_map.get(video_type, video_type)

            # ✅ 除錯用：確認 video_type 與設定對應是否正確
            logging.debug(f"🎞️ [DEBUG] 處理影片類型: 原始={video_type}, 映射後={type_for_setting}")
            logging.debug(f"🧪 [DEBUG] 設定中是否存在類型 '{type_for_setting}': {'✅ 存在' if type_for_setting in settings else '❌ 不存在'}")

            result = match_category_and_game(title, type_for_setting, settings)

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

def update_latest_videos(db, channel_id: str) -> dict:
    """
    增量同步指定頻道的最新影片：
    - 以 cache_meta.lastVideoSyncAt 作為篩選起點
    - 新增影片後，將 lastVideoSyncAt 更新為「最新影片的 publishDate（ISO 字串，UTC）」
    """
    try:
        # 取得分類設定
        settings_ref = db.collection("channel_data").document(channel_id).collection("settings").document("config")
        settings_doc = settings_ref.get()
        if not settings_doc.exists:
            raise ValueError("找不到分類設定 config")
        settings = settings_doc.to_dict()

        # 讀取 cache_meta 的 lastVideoSyncAt
        cache_meta_ref = db.collection("channel_data").document(channel_id).collection("channel_info").document("cache_meta")
        cache_meta_doc = cache_meta_ref.get()
        last_sync_time = None
        if cache_meta_doc.exists:
            raw_sync = cache_meta_doc.to_dict().get("lastVideoSyncAt")
            if raw_sync:
                # 可能是 ISO 字串或 Firestore Timestamp，統一轉成 timezone-aware datetime
                if isinstance(raw_sync, str):
                    last_sync_time = parse(raw_sync)
                else:  # Timestamp 物件
                    try:
                        last_sync_time = raw_sync.to_datetime()
                    except AttributeError:
                        logging.warning("⚠️ [update_latest_videos] 無法解析 lastVideoSyncAt: %s", raw_sync)

        # 計算日期範圍：從 last_sync_time 到現在（UTC）
        now_utc = datetime.now(timezone.utc)
        date_ranges = [(last_sync_time, now_utc)] if last_sync_time else None

        raw_items = get_video_data(date_ranges=date_ranges, input_channel=channel_id)
        logging.info(f"🔍 [update_latest_videos] 撈回影片數量：{len(raw_items)}")

        added, skipped = 0, 0
        max_publish_time = None  # datetime 物件

        for raw_item in raw_items:
            item = normalize_video_item(raw_item)
            if not item:
                continue

            video_id = item.get("videoId")
            title = item.get("title")
            publish_date_str = item.get("publishDate")  # ISO 字串
            duration = item.get("duration")
            video_type = item.get("type")

            if not all([video_id, title, publish_date_str, video_type]):
                logging.warning("⚠️ [update_latest_videos] 略過資料不完整影片: %s", item)
                continue

            # 將 publish_date 字串轉為 datetime（只用於比較）
            try:
                publish_dt = parse(publish_date_str)
            except Exception:
                logging.warning("⚠️ [update_latest_videos] 無法解析日期字串: %s", publish_date_str, exc_info=True)
                continue

            video_ref = db.collection("channel_data").document(channel_id).collection("videos").document(video_id)
            if video_ref.get().exists:
                skipped += 1
                continue

            type_for_setting = type_map.get(video_type, video_type)
            result = match_category_and_game(title, type_for_setting, settings)

            video_data = {
                "videoId": video_id,
                "title": title,
                "publishDate": publish_date_str,
                "duration": duration,
                "type": video_type,
                "matchedCategories": result["matchedCategories"],
                "game": result["game"],
                "matchedKeywords": result["matchedKeywords"]
            }

            video_ref.set(video_data)
            added += 1

            # 更新最新發佈時間
            if not max_publish_time or publish_dt > max_publish_time:
                max_publish_time = publish_dt

        # 若有新增影片，更新 cache_meta 的 lastVideoSyncAt
        updated_time_str = None
        if added > 0 and max_publish_time:
            updated_time_str = max_publish_time.isoformat()
            cache_meta_ref.set({
                "lastVideoSyncAt": updated_time_str
            }, merge=True)

        logging.info(f"✅ [update_latest_videos] 新增 {added} 筆，略過 {skipped} 筆")
        return {
            "added": added,
            "skipped": skipped,
            "updatedSyncTime": updated_time_str
        }

    except Exception:
        logging.exception("🔥 [update_latest_videos] 同步影片發生錯誤")
        raise

def apply_category_settings_to_videos(db, channel_id: str, settings: dict) -> int:
    """
    套用最新的分類設定到所有已存在的影片上，僅更新分類有變動的影片，回傳實際更新數量。
    """
    try:
        videos_ref = db.collection("channel_data").document(channel_id).collection("videos")
        video_docs = videos_ref.stream()

        updated_count = 0

        for doc in video_docs:
            video = doc.to_dict()
            video_id = video.get("videoId")
            if not video_id:
                continue

            original_categories = video.get("matchedCategories")
            original_game = video.get("game")
            original_keywords = set(video.get("matchedKeywords", []))

            video_type = video.get("type", "")
            title = video.get("title", "")

            type_for_setting = type_map.get(video_type, video_type)

            # 重新套用分類邏輯
            result = match_category_and_game(title, type_for_setting, settings)
            new_categories = result.get("matchedCategories")
            new_game = result.get("game")
            new_keywords = set(result.get("matchedKeywords", []))

            if (
                new_categories != original_categories or
                new_game != original_game or
                original_keywords != new_keywords
            ):
                video_ref = videos_ref.document(video_id)
                video_ref.update({
                    "matchedCategories": new_categories,
                    "game": new_game,
                    "matchedKeywords": list(new_keywords)
                })
                updated_count += 1

        logging.info(f"✅ [apply_category_settings_to_videos] 更新完成，共更新 {updated_count} 筆影片")
        return updated_count

    except Exception:
        logging.exception("🔥 [apply_category_settings_to_videos] 更新分類時發生錯誤")
        return 0