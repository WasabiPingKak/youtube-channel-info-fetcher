import logging
from typing import Dict, Any
from firebase_admin.firestore import Client

logger = logging.getLogger(__name__)
logger.debug("✅ [settings_preparer.py] 模組載入中...")

try:
    from utils.game_alias_fetcher import fetch_global_alias_map
    logger.debug("✅ 匯入 fetch_global_alias_map 成功")
except Exception as e:
    logger.error("❌ 匯入 fetch_global_alias_map 失敗: %s", e, exc_info=True)

try:
    from utils.game_alias_merger import merge_game_aliases
    logger.debug("✅ 匯入 merge_game_aliases 成功")
except Exception as e:
    logger.error("❌ 匯入 merge_game_aliases 失敗: %s", e, exc_info=True)


def merge_game_category_aliases(
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    傳入原始 Firestore settings，對所有影片類型（live/videos/shorts）進行遊戲別名合併。
    """
    try:
        logger.debug("🔧 merge_game_category_aliases() 被呼叫（合併全部類型）")

        settings = settings.copy()
        global_alias_map = fetch_global_alias_map()
        logger.debug("🌐 取得中央遊戲別名數量：%d", len(global_alias_map))

        for video_type_key in ("live", "videos", "shorts"):
            category_settings = settings.get(video_type_key, {})

            if "遊戲" not in category_settings:
                logger.debug("🟡 [%s] 中無 [遊戲] 區塊，略過。", video_type_key)
                continue

            user_config = category_settings.get("遊戲", [])
            logger.debug("📥 [%s] 使用者自訂條目：%d", video_type_key, len(user_config))

            merged_games = merge_game_aliases(user_config, global_alias_map)
            logger.debug("🔗 [%s] 合併後條目數：%d", video_type_key, len(merged_games))

            category_settings["遊戲"] = merged_games
            settings[video_type_key] = category_settings

            logger.debug("✅ [%s] 遊戲別名合併完成", video_type_key)

        return settings

    except Exception:
        logger.error("🔥 [merge_game_category_aliases] 全類型合併失敗", exc_info=True)
        return settings


def merge_with_default_categories(
    db: Client,
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    讀取 global_settings/default_categories_config，並將 default 設定合併到 settings 中。
    - 預設設定為基底
    - 使用者自訂設定優先，合併後去除重複關鍵字
    """
    try:
        logger.debug("🔧 merge_with_default_categories() 被呼叫")

        default_ref = db.collection("global_settings").document("default_categories_config")
        default_doc = default_ref.get()
        if not default_doc.exists:
            logger.warning("⚠️ 找不到 default_categories_config，跳過合併")
            return settings

        default_config = default_doc.to_dict()
        logger.debug("📥 成功載入 default_categories_config，主分類數量：%d", len(default_config))

        settings = settings.copy()
        for video_type in ("live", "videos", "shorts"):
            settings.setdefault(video_type, {})

            for main_category, default_keywords in default_config.items():
                user_keywords = settings[video_type].get(main_category, [])
                merged = list(set(default_keywords) | set(user_keywords))
                settings[video_type][main_category] = merged

        logger.debug("✅ 主分類 default 設定合併完成")
        return settings

    except Exception:
        logger.error("🔥 merge_with_default_categories 發生錯誤", exc_info=True)
        return settings
