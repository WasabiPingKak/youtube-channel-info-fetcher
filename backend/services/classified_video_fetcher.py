import logging
from datetime import datetime

from firebase_admin.firestore import Client

from utils.categorizer import match_category_and_game
from utils.settings_game_merger import merge_game_categories_with_aliases
from utils.settings_main_merger import merge_main_categories_with_user_config
from utils.youtube_utils import normalize_video_item

logger = logging.getLogger(__name__)

# 類型映射：轉為統一比對格式
type_map = {
    "直播檔": "live",
    "直播": "live",
    "影片": "videos",
    "Shorts": "shorts",
    "shorts": "shorts",
}


def get_merged_settings(db: Client, channel_id: str) -> dict:
    """
    讀取並合併後端設定，包含主分類與遊戲別名。
    可用於影片分類前的準備，或除錯用途。
    """
    settings_ref = (
        db.collection("channel_data").document(channel_id).collection("settings").document("config")
    )
    settings_doc = settings_ref.get()
    if not settings_doc.exists:
        logger.warning("⚠️ 無分類設定 config，頻道 %s", channel_id)
        return {}

    settings = settings_doc.to_dict()

    # 🧩 合併 default_categories_config_v2（主分類設定）
    settings = merge_main_categories_with_user_config(db, settings)

    # 🔁 合併遊戲別名（中央別名 + 使用者自訂）
    settings = merge_game_categories_with_aliases(settings)

    return settings


def get_classified_videos(
    db: Client,
    channel_id: str,
    start: datetime | None = None,
    end: datetime | None = None,
) -> list[dict]:
    """
    從 videos_batch 撈出影片，套用分類設定後回傳，格式與舊 API 一致。
    - 支援傳入 start / end 為 UTC+0 時間範圍（datetime，含時區）
    - 不寫入 Firestore
    - 僅回傳符合 video_type 的影片
    """
    try:
        settings = get_merged_settings(db, channel_id)
        if not settings:
            return []

        batch_ref = db.collection("channel_data").document(channel_id).collection("videos_batch")
        docs = list(batch_ref.stream())
        raw_items = []
        for doc in docs:
            data = doc.to_dict()
            raw_items.extend(data.get("videos", []))

        logger.info(f"📦 讀取 {len(docs)} 筆 batch，共 {len(raw_items)} 部影片")

        results = []
        skipped = 0  # 紀錄被時間過濾掉的數量
        for raw_item in raw_items:
            item = normalize_video_item(raw_item)
            if not item:
                logger.warning("⚠️ normalize_video_item 失敗: %s", raw_item)
                continue

            # 🕓 時間過濾處理
            try:
                publish_dt = datetime.fromisoformat(item["publishDate"])  # aware UTC+0 datetime
                if start and publish_dt < start:
                    skipped += 1
                    continue
                if end and publish_dt > end:
                    skipped += 1
                    continue
            except ValueError:
                logger.warning("⚠️ 解析 publishDate 失敗：%s", item["publishDate"])
                continue

            result = match_category_and_game(item["title"], item["type"], settings)

            video_data = {
                "videoId": item["videoId"],
                "title": item["title"],
                "publishDate": item["publishDate"],
                "duration": item["duration"],
                "type": item["type"],
                "matchedCategories": result["matchedCategories"],
                "game": result["game"],
                "matchedKeywords": result["matchedKeywords"],
                "matchedPairs": result.get("matchedPairs", []),
            }

            results.append(video_data)

        logger.info(
            f"✅ 成功分類 {len(results)} 部影片"
            f"（已篩掉 {skipped} 部不在時間範圍內）"
            f"｜時間區間：start={start.isoformat() if start else '未指定'}，"
            f"end={end.isoformat() if end else '未指定'}"
        )
        return results

    except Exception as e:
        logger.error("🔥 get_classified_videos 發生錯誤: %s", e, exc_info=True)
        return []


def classify_live_title(db: Client, channel_id: str, title: str) -> dict:
    """
    根據直播標題與頻道設定分類主題，回傳分類結果 dict。
    僅針對直播類型影片設計。

    回傳格式：
    {
        "matchedCategories": [...],
        "matchedPairs": [...]
    }
    """
    try:
        settings = get_merged_settings(db, channel_id)
        if not settings:
            return {
                "matchedCategories": [],
                "matchedPairs": [],
            }

        result = match_category_and_game(title, "live", settings)
        return {
            "matchedCategories": result.get("matchedCategories", []),
            "matchedPairs": result.get("matchedPairs", []),
        }

    except Exception as e:
        logger.warning(
            "⚠️ classify_live_title 失敗：channel_id=%s, title=%s, error=%s",
            channel_id,
            title,
            e,
        )
        return {
            "matchedCategories": [],
            "matchedPairs": [],
        }
