import logging
from typing import List, Dict, Any


def normalize(text: str) -> str:
    """
    將文字轉為小寫並移除全形／半形空白，方便比對。
    """
    return text.lower().replace(" ", "").replace("　", "")


def match_category_and_game(
    title: str, video_type: str, settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    根據設定檔判斷影片標題屬於哪些主分類，並解析遊戲名稱。

    回傳格式：
    {
        "matchedCategories": List[str],  # e.g. ["遊戲", "雜談"]
        "game": Optional[str],          # e.g. "GeoGuessr"
        "matchedKeywords": List[str]    # 實際命中的關鍵字
    }
    """
    try:
        matched_categories: List[str] = []
        matched_keywords: List[str] = []
        matched_game: str | None = None

        normalized_title = normalize(title)
        logging.debug("🔍 [match] 處理影片標題: %s", title)
        logging.debug("🔍 [match] normalized: %s", normalized_title)

        category_settings = settings.get(video_type, {})
        logging.debug("📁 [match] 類型分類設定: %s", list(category_settings.keys()))

        # ────────────────────────────────────────────────
        # 1️⃣ 先處理「非遊戲」主分類
        # ────────────────────────────────────────────────
        for category, keywords in category_settings.items():
            if category == "遊戲":
                continue

            for kw in keywords:
                if normalize(kw) in normalized_title:
                    if category not in matched_categories:            # 避免重複
                        matched_categories.append(category)
                    matched_keywords.append(kw)

        # ────────────────────────────────────────────────
        # 2️⃣ 處理「遊戲」主分類
        # ────────────────────────────────────────────────
        game_entries = category_settings.get("遊戲", [])
        matched_game_name: str | None = None

        if isinstance(game_entries, list):
            for game_entry in game_entries:
                game_name = game_entry.get("game")
                keywords = game_entry.get("keywords", [])

                # 全部別名 + game_name 一同比對
                all_keywords = keywords + ([game_name] if game_name else [])
                if any(normalize(kw) in normalized_title for kw in all_keywords):
                    matched_game_name = game_name
                    break  # 命中第一個即停；陣列順序代表優先序

        # ────────────────────────────────────────────────
        # 3️⃣ 統整結果
        # ────────────────────────────────────────────────
        if matched_game_name:
            matched_game = matched_game_name
            if "遊戲" not in matched_categories:                       # 追加不覆蓋
                matched_categories.append("遊戲")

            if matched_game_name and matched_game_name not in matched_keywords:
                matched_keywords.append(matched_game_name)
        else:
            # 若未命中遊戲，確保不殘留「遊戲」分類
            matched_categories = [
                cat for cat in matched_categories if cat != "遊戲"
            ]

        # 去重（保序）
        matched_categories = list(dict.fromkeys(matched_categories))
        matched_keywords = list(dict.fromkeys(matched_keywords))

        # 若無任何命中且設定有「其他」，回填「其他」
        if not matched_categories and "其他" in category_settings:
            matched_categories = ["其他"]

        return {
            "matchedCategories": matched_categories,
            "game": matched_game,
            "matchedKeywords": matched_keywords,
        }

    except Exception:  # noqa: BLE001
        logging.error(
            "🔥 [match_category_and_game] 發生分類錯誤", exc_info=True
        )
        return {
            "matchedCategories": ["其他"],
            "game": None,
            "matchedKeywords": [],
        }
