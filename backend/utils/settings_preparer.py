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
    即使使用者尚未定義「遊戲」子分類，也會加入中央定義的別名。
    """
    try:
        logger.debug("🔧 merge_game_category_aliases() 被呼叫（合併全部類型）")

        settings = settings.copy()
        global_alias_map = fetch_global_alias_map()
        logger.debug("🌐 取得中央遊戲別名數量：%d", len(global_alias_map))

        for video_type_key in ("live", "videos", "shorts"):
            category_settings = settings.get(video_type_key, {})

            # 若沒有「遊戲」子分類則使用空陣列
            user_config = category_settings.get("遊戲", [])
            logger.debug("📥 [%s] 使用者自訂條目：%d", video_type_key, len(user_config))

            merged_games = merge_game_aliases(user_config, global_alias_map)
            logger.debug("🔗 [%s] 合併後條目數：%d", video_type_key, len(merged_games))

            # 寫回「遊戲」子分類
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
    讀取 global_settings/default_categories_config_v2，完全覆蓋使用者分類設定。
    - 使用 default 設定為唯一依據（雜談、節目、音樂等）
    - 🔒 暫時跳過使用者自訂分類設定，僅使用 default v2 結構
    - ✅ 但保留使用者的「遊戲」分類設定，以便後續合併遊戲別名
    """
    try:
        logger.debug("🔧 merge_with_default_categories() 被呼叫（覆蓋模式）")

        default_ref = db.collection("global_settings").document("default_categories_config_v2")
        default_doc = default_ref.get()
        if not default_doc.exists:
            logger.warning("⚠️ 找不到 default_categories_config_v2，跳過合併")
            return settings

        default_config = default_doc.to_dict()
        logger.debug("📥 成功載入 default_categories_config_v2，主分類數量：%d", len(default_config))

        settings = settings.copy()

        # ⏳ 暫存原本的遊戲設定，以便覆蓋後補回
        preserved_game_config = {
            video_type: settings.get(video_type, {}).get("遊戲", [])
            for video_type in ("live", "videos", "shorts")
        }

        for video_type in ("live", "videos", "shorts"):
            logger.debug("🔄 覆蓋 %s 類型的分類設定", video_type)

            new_config: Dict[str, Any] = {}

            for main_category, default_subcategories in default_config.items():
                if not isinstance(default_subcategories, dict):
                    logger.warning("⚠️ default [%s] 非 dict 結構，跳過", main_category)
                    continue

                new_config[main_category] = {}

                for sub_name, default_keywords in default_subcategories.items():
                    new_config[main_category][sub_name] = default_keywords
                    logger.debug("    ✅ %s > %s 條目 %d 個關鍵字", main_category, sub_name, len(default_keywords))

            # ✅ 補回原有的「遊戲」分類設定
            if preserved_game_config[video_type]:
                new_config["遊戲"] = preserved_game_config[video_type]
                logger.debug("🕹️ 保留原有遊戲設定，%s 共 %d 筆", video_type, len(preserved_game_config[video_type]))

            settings[video_type] = new_config

        logger.debug("✅ 全部分類設定已使用 default 覆蓋（含遊戲補回）")
        return settings

    except Exception:
        logger.error("🔥 merge_with_default_categories 發生錯誤", exc_info=True)
        return settings
