import logging
from typing import Dict, Any
from firebase_admin.firestore import Client

logger = logging.getLogger(__name__)
logger.debug("✅ [settings_main_merger.py] 模組載入中...")

def merge_main_categories_with_user_config(
    db: Client,
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    載入 default_categories_config_v2，與使用者自訂設定（扁平主分類格式）合併。
    - 相同子分類名稱合併關鍵字，去重
    - 若關鍵字與子分類名稱相同則移除
    - 結果為 live/videos/shorts 三份設定
    - 保留使用者的「遊戲」分類（若無則補空字典）
    """
    try:
        logger.debug("🔧 merge_main_categories_with_user_config() 被呼叫")

        default_ref = db.collection("global_settings").document("default_categories_config_v2")
        default_doc = default_ref.get()
        if not default_doc.exists:
            logger.warning("⚠️ 找不到 default_categories_config_v2，跳過合併")
            return settings

        default_config = default_doc.to_dict()
        logger.debug("📥 成功載入 default_categories_config_v2")

        # 🔍 使用者設定為扁平主分類格式
        user_config = {
            k: v for k, v in settings.items()
            if isinstance(v, dict) and k not in ("live", "videos", "shorts")
        }

        # 🧩 合併後的扁平格式結果
        merged_flat: Dict[str, Dict[str, list[str]]] = {}

        # 1️⃣ 加入 default 結構
        for main_cat, subcats in default_config.items():
            if not isinstance(subcats, dict):
                logger.warning("⚠️ default [%s] 非 dict 結構，跳過", main_cat)
                continue
            merged_flat[main_cat] = {}
            for sub_name, keywords in subcats.items():
                merged_flat[main_cat][sub_name] = list(keywords)

        # 2️⃣ 合併使用者設定
        for main_cat, user_subcats in user_config.items():
            if not isinstance(user_subcats, dict):
                logger.warning("⚠️ user [%s] 非 dict 結構，略過", main_cat)
                continue
            if main_cat not in merged_flat:
                merged_flat[main_cat] = {}

            for sub_name, user_keywords in user_subcats.items():
                if not isinstance(user_keywords, list):
                    logger.warning("⚠️ [%s > %s] 關鍵字不是 list，略過", main_cat, sub_name)
                    continue

                existing_keywords = merged_flat[main_cat].get(sub_name, [])
                merged_keywords = existing_keywords + user_keywords
                # 去重 + 排除與子分類名稱重複的字詞
                merged_keywords = list(dict.fromkeys(merged_keywords))
                merged_keywords = [kw for kw in merged_keywords if kw != sub_name]
                merged_flat[main_cat][sub_name] = merged_keywords

                logger.debug("    ✅ 合併 %s > %s：%d 個關鍵字", main_cat, sub_name, len(merged_keywords))

        # 3️⃣ 將合併後扁平設定複製到 live/videos/shorts
        for video_type in ("live", "videos", "shorts"):
            merged_config = dict(merged_flat)

            # 4️⃣ 加回原本遊戲設定（若存在），否則補空或從最外層移入
            if (
                isinstance(settings.get(video_type), dict)
                and "遊戲" in settings[video_type]
                and isinstance(settings[video_type]["遊戲"], dict)
            ):
                merged_config["遊戲"] = settings[video_type]["遊戲"]
                logger.debug("🕹️ [%s] 保留原有遊戲設定，共 %d 條目", video_type, len(merged_config["遊戲"]))
            elif "遊戲" in settings and isinstance(settings["遊戲"], dict):
                merged_config["遊戲"] = settings["遊戲"]
                logger.debug("🕹️ [%s] 從最外層搬移遊戲設定，共 %d 條目", video_type, len(merged_config["遊戲"]))
            else:
                merged_config["遊戲"] = {}
                logger.debug("🕹️ [%s] 無遊戲設定，自動補空", video_type)

            settings[video_type] = merged_config

        # 🔚 清除合併後殘留的扁平主分類設定，避免被誤讀
        for k in list(settings.keys()):
            if k not in ("live", "videos", "shorts"):
                del settings[k]

        logger.debug("✅ 已完成主分類與子分類合併，應用至 live/videos/shorts")
        return settings

    except Exception:
        logger.error("🔥 merge_main_categories_with_user_config 發生錯誤", exc_info=True)
        return settings
