import logging
from typing import Dict, Any

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


def prepare_settings_with_aliases(
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    傳入原始 Firestore settings，對所有影片類型（live/videos/shorts）進行遊戲別名合併。
    """
    try:
        logger.debug("🔧 prepare_settings_with_aliases() 被呼叫（合併全部類型）")

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
        logger.error("🔥 [prepare_settings_with_aliases] 全類型合併失敗", exc_info=True)
        return settings
