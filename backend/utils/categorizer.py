import logging
from typing import List, Dict, Any

def normalize(text: str) -> str:
    return text.lower().replace(" ", "").replace("　", "")

TYPE_MAP = {
    "直播檔": "live",
    "直播": "live",
    "影片": "videos",
    "Shorts": "shorts",
    "shorts": "shorts"
}

def match_category_and_game(
    title: str, video_type: str, settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    根據設定檔判斷影片標題屬於哪些主分類，並解析遊戲名稱。

    回傳格式：
    {
        "matchedCategories": List[str],  # e.g. ["遊戲", "雜談"]
        "game": Optional[str],          # e.g. "GeoGuessr"
        "matchedKeywords": List[str],   # 實際命中的關鍵字
        "matchedPairs": List[Dict]      # e.g. [{main: "遊戲", keyword: "GeoGuessr", hitKeywords: ["mc", "麥塊"]}]
    }
    """
    try:
        matched_categories: List[str] = []
        matched_keywords: List[str] = []
        matched_pairs: List[Dict[str, Any]] = []
        matched_game: str | None = None

        logging.debug("🧪 settings 結構：%s", settings.keys())
        logging.debug("🧪 settings['live'] = %s", settings.get("live", "❌ 無資料"))

        normalized_title = normalize(title)
        logging.debug("🔍 [match] 處理影片標題: %s", title)
        logging.debug("🔍 [match] normalized: %s", normalized_title)

        logging.debug("🔍 [match] 傳入的 video_type: %s", video_type)
        logging.debug("🧩 [match] settings 結構: %s", list(settings.keys()))
        type_key = TYPE_MAP.get(video_type, video_type)
        category_settings = settings.get(type_key, {})
        logging.debug("📁 [match] 類型分類設定: %s", list(category_settings.keys()))

        # ────────────────────────────────────────────────
        # 1️⃣ 先處理「非遊戲」主分類
        # ────────────────────────────────────────────────
        # 1️⃣ 處理「非遊戲」主分類（支援主分類 ➝ 子分類 ➝ 關鍵字）
        for main_category, subcategories in category_settings.items():
            if main_category == "遊戲":
                continue

            if not isinstance(subcategories, dict):
                logging.warning("⚠️ [%s] 不是 dict 結構，略過（可能是舊格式）", main_category)
                continue

            for sub_name, keywords in subcategories.items():
                hit_keywords = []

                # 子分類名稱本身也納入比對
                if normalize(sub_name) in normalized_title:
                    hit_keywords.append(sub_name)

                for kw in keywords:
                    if normalize(kw) in normalized_title:
                        hit_keywords.append(kw)

                if hit_keywords:
                    if main_category not in matched_categories:
                        matched_categories.append(main_category)
                    matched_keywords.extend(hit_keywords)
                    matched_pairs.append({
                        "main": main_category,
                        "keyword": sub_name,
                        "hitKeywords": hit_keywords
                    })
                    logging.debug("🏷️ 命中分類 [%s > %s] via %s", main_category, sub_name, hit_keywords)

        # ────────────────────────────────────────────────
        # 2️⃣ 處理「遊戲」主分類
        # ────────────────────────────────────────────────
        game_entries = category_settings.get("遊戲", [])
        matched_game_name: str | None = None
        hit_keywords: List[str] = []

        if isinstance(game_entries, list):
            for game_entry in game_entries:
                game_name = game_entry.get("game")
                keywords = game_entry.get("keywords", [])
                all_keywords = keywords + ([game_name] if game_name else [])

                for kw in all_keywords:
                    if normalize(kw) in normalized_title:
                        matched_game_name = game_name
                        matched_keywords.append(kw)
                        hit_keywords.append(kw)
                        logging.debug("🎮 命中遊戲 [%s] via keyword [%s]", game_name, kw)
                        break

                if matched_game_name:
                    matched_pairs.append({
                        "main": "遊戲",
                        "keyword": game_name,
                        "hitKeywords": hit_keywords  # ✅ 新增命中關鍵字
                    })
                    break

        # ────────────────────────────────────────────────
        # 3️⃣ 統整結果
        # ────────────────────────────────────────────────
        if matched_game_name:
            matched_game = matched_game_name
            if "遊戲" not in matched_categories:
                matched_categories.append("遊戲")
        else:
            matched_categories = [
                cat for cat in matched_categories if cat != "遊戲"
            ]

        matched_categories = list(dict.fromkeys(matched_categories))
        matched_keywords = list(dict.fromkeys(matched_keywords))

        if not matched_categories and "其他" in category_settings:
            matched_categories = ["其他"]
            logging.debug("➕ 無命中分類，自動套用 [其他]")

        logging.debug("✅ [match] 結果 | Categories: %s | Game: %s | Keywords: %s | Pairs: %s",
                      matched_categories, matched_game, matched_keywords, matched_pairs)

        return {
            "matchedCategories": matched_categories,
            "game": matched_game,
            "matchedKeywords": matched_keywords,
            "matchedPairs": matched_pairs
        }

    except Exception:  # noqa: BLE001
        logging.error("🔥 [match_category_and_game] 發生分類錯誤", exc_info=True)
        return {
            "matchedCategories": ["其他"],
            "game": None,
            "matchedKeywords": [],
            "matchedPairs": [{"main": "其他", "keyword": "", "hitKeywords": []}]
        }
