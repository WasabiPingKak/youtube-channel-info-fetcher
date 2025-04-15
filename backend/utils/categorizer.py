
import logging

def normalize(text: str) -> str:
    """
    清洗文字：轉小寫並移除所有中英文空白（全形、半形）
    """
    return text.lower().replace(" ", "").replace("　", "")

def match_category_and_game(title: str, video_type: str, settings: dict) -> dict:
    try:
        matched_categories = []
        matched_keywords = []
        matched_game = None

        normalized_title = normalize(title)

        # 處理主分類
        category_settings = settings.get(video_type, {})
        for category, keywords in category_settings.items():
            for kw in keywords:
                if normalize(kw) in normalized_title:
                    if category not in matched_categories:
                        matched_categories.append(category)
                    matched_keywords.append(kw)

        # 若沒有任何主分類命中，補上「其他」
        if not matched_categories and "其他" in category_settings:
            matched_categories.append("其他")

        # 處理遊戲關鍵字
        for game_entry in settings.get("game_tags", []):
            game_name = game_entry.get("game")
            keywords = game_entry.get("keywords", [])
            all_keywords = keywords + [game_name]
            for kw in all_keywords:
                if normalize(kw) in normalized_title:
                    matched_game = game_name
                    matched_keywords.append(kw)
                    break
            if matched_game:
                break  # 命中一組遊戲後不再繼續找

        return {
            "matchedCategories": matched_categories,
            "game": matched_game,
            "matchedKeywords": list(set(matched_keywords)),  # 去重
        }

    except Exception:
        logging.error("🔥 [match_category_and_game] 發生分類錯誤", exc_info=True)
        return {
            "matchedCategories": ["其他"],
            "game": None,
            "matchedKeywords": []
        }
