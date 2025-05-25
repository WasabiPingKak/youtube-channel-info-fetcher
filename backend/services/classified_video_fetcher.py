from typing import List, Dict
from firebase_admin.firestore import Client
from utils.categorizer import match_category_and_game
from utils.youtube_utils import normalize_video_item
from utils.settings_preparer import (
    merge_game_category_aliases,
    merge_with_default_categories
)
import logging

logger = logging.getLogger(__name__)

# 類型映射：轉為統一比對格式
type_map = {
    "直播檔": "live",
    "直播": "live",
    "影片": "videos",
    "Shorts": "shorts",
    "shorts": "shorts"
}

def get_classified_videos(db: Client, channel_id: str, video_type: str) -> List[Dict]:
    """
    從 videos_batch 撈出影片，套用分類設定後回傳，格式與舊 API 一致。
    - 不寫入 Firestore
    - 僅回傳符合 video_type 的影片
    """
    try:
        # 1️⃣ 讀取分類設定
        settings_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("settings")
            .document("config")
        )
        settings_doc = settings_ref.get()
        if not settings_doc.exists:
            logger.warning("⚠️ 無分類設定 config，頻道 %s", channel_id)
            return []

        settings = settings_doc.to_dict()

        # 🧩 合併 default_categories_config（主分類設定）
        settings = merge_with_default_categories(db, settings)

        # 🔁 合併遊戲別名（中央別名 + 使用者自訂）
        settings = merge_game_category_aliases(settings)

        # 2️⃣ 讀取所有 batch 文件
        batch_ref = db.collection("channel_data").document(channel_id).collection("videos_batch")
        docs = list(batch_ref.stream())
        raw_items = []
        for doc in docs:
            data = doc.to_dict()
            raw_items.extend(data.get("videos", []))

        logger.info(f"📦 讀取 {len(docs)} 筆 batch，共 {len(raw_items)} 部影片")

        results = []
        for raw_item in raw_items:
            item = normalize_video_item(raw_item)
            if not item:
                logger.warning("⚠️ normalize_video_item 失敗: %s", raw_item)
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
                "matchedPairs": result.get("matchedPairs", [])
            }

            logger.debug("🎯 命中分類: %s", video_data)
            results.append(video_data)

        logger.info(f"✅ 成功分類 {len(results)} 部影片（type={video_type}）")
        return results

    except Exception as e:
        logger.error("🔥 get_classified_videos 發生錯誤: %s", e, exc_info=True)
        return []
