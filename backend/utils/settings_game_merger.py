import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)
logger.debug("✅ [settings_game_merger.py] 模組載入中...")

try:
    from utils.game_alias_fetcher import fetch_global_alias_map
    logger.debug("✅ 匯入 fetch_global_alias_map 成功")
except Exception as e:
    logger.error("❌ 匯入 fetch_global_alias_map 失敗: %s", e, exc_info=True)

def merge_game_categories_with_aliases(
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    傳入原始 Firestore settings，對所有影片類型（live/videos/shorts）進行遊戲別名合併。
    - 使用者設定與 global alias 結合，遊戲名稱一致時關鍵字合併（去重）
    - 使用者優先，但不覆蓋原 alias，而是合併關鍵字
    - 格式為 Dict[str, List[str]]，例：{"Minecraft": ["MC", "麥塊"]}
    """
    try:
        logger.debug("🔧 merge_game_categories_with_aliases() 被呼叫（合併全部類型）")

        settings = settings.copy()
        global_alias_map = fetch_global_alias_map()
        logger.debug("🌐 取得中央遊戲別名數量：%d", len(global_alias_map))

        for video_type_key in ("live", "videos", "shorts"):
            category_settings = settings.get(video_type_key, {})
            user_game_config = category_settings.get("遊戲", {})

            if not isinstance(user_game_config, dict):
                logger.warning("⚠️ [%s] 使用者遊戲分類格式錯誤，重設為空 dict", video_type_key)
                user_game_config = {}

            logger.debug("📥 [%s] 使用者自訂遊戲項目：%d", video_type_key, len(user_game_config))

            merged_games: Dict[str, list[str]] = {}

            # 1️⃣ 遍歷所有 global alias，與使用者定義合併
            for game_name, global_keywords in global_alias_map.items():
                user_keywords = user_game_config.get(game_name, [])
                if not isinstance(user_keywords, list):
                    user_keywords = []

                # 合併去重
                merged_keywords = list(dict.fromkeys(global_keywords + user_keywords))
                merged_games[game_name] = merged_keywords

            # 2️⃣ 補上使用者新增但 global 沒有的遊戲
            for game_name, user_keywords in user_game_config.items():
                if game_name not in merged_games:
                    merged_games[game_name] = user_keywords

            logger.debug("🔗 [%s] 合併後遊戲項目：%d", video_type_key, len(merged_games))

            category_settings["遊戲"] = merged_games
            settings[video_type_key] = category_settings

            logger.debug("✅ [%s] 遊戲別名合併完成", video_type_key)

        return settings

    except Exception:
        logger.error("🔥 [merge_game_categories_with_aliases] 全類型合併失敗", exc_info=True)
        return settings
