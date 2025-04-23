
import logging
import re

def normalize(text: str) -> str:
    text = text.lower().replace(" ", "").replace("　", "")
    return text

def match_category_and_game(title: str, video_type: str, settings: dict) -> dict:
    try:
        matched_categories = []
        matched_keywords = []
        matched_game = None

        normalized_title = normalize(title)
        logging.debug(f"🔍 [match] 處理影片標題: {title}")
        logging.debug(f"🔍 [match] normalized: {normalized_title}")

        category_settings = settings.get(video_type, {})
        logging.debug(f"📁 [match] 類型分類設定: {list(category_settings.keys())}")

        # ✅ 主分類處理
        for category, keywords in category_settings.items():
            if category == "遊戲":
                continue
            for kw in keywords:
                if normalize(kw) in normalized_title:
                    if category not in matched_categories:
                        matched_categories.append(category)
                    matched_keywords.append(kw)

        # ✅ 遊戲分類處理
        game_entries = category_settings.get("遊戲", [])
        matched_game_keywords = set()
        matched_game_name = None

        if isinstance(game_entries, list):
            for game_entry in game_entries:
                game_name = game_entry.get("game")
                keywords = game_entry.get("keywords", [])
                all_keywords = keywords + [game_name] if game_name else []
                for kw in all_keywords:
                    if normalize(kw) in normalized_title:
                        matched_game_name = game_name
                        matched_game_keywords.add(kw)
                        break
                if matched_game_name:
                    break

        # ✅ 統一整理分類結果
        if matched_game_name:
            matched_game = matched_game_name
            matched_categories = ["遊戲"]
            matched_keywords.extend(list(matched_game_keywords))
        else:
            matched_game = None
            matched_categories = [cat for cat in matched_categories if cat != "遊戲"]

        # ✅ 最後處理 "其他" 類別
        if not matched_categories and "其他" in category_settings:
            matched_categories = ["其他"]

        return {
            "matchedCategories": matched_categories,
            "game": matched_game,
            "matchedKeywords": list(set(matched_keywords))
        }

    except Exception:
        logging.error("🔥 [match_category_and_game] 發生分類錯誤", exc_info=True)
        return {
            "matchedCategories": ["其他"],
            "game": None,
            "matchedKeywords": []
        }
