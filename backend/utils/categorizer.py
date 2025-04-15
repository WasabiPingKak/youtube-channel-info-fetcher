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
        game_entries = category_settings.get("遊戲", [])
        logging.debug(f"🎮 [match] 遊戲分類清單: {game_entries}")

        # 處理主分類（不含遊戲）
        for category, keywords in category_settings.items():
            if category == "遊戲":
                continue  # 遊戲分類獨立處理
            logging.debug(f"🔍 [match] 主分類: {category} → 關鍵字: {keywords}")
            for kw in keywords:
                if normalize(kw) in normalized_title:
                    logging.debug(f"✅ 命中關鍵字: {kw} → 分類: {category}")
                    if category not in matched_categories:
                        matched_categories.append(category)
                    matched_keywords.append(kw)

        # 處理遊戲分類
        if isinstance(game_entries, list):
            for game_entry in game_entries:
                game_name = game_entry.get("game")
                keywords = game_entry.get("keywords", [])
                all_keywords = keywords + [game_name] if game_name else []
                for kw in all_keywords:
                    if normalize(kw) in normalized_title:
                        logging.debug(f"🎮 命中遊戲關鍵字: {kw} → 遊戲: {game_name}")
                        matched_game = game_name
                        matched_keywords.append(kw)
                        if "遊戲" not in matched_categories:
                            matched_categories.append("遊戲")
                        break
                if matched_game:
                    break

        # 若沒有命中任何主分類，補上「其他」
        if not matched_categories and "其他" in category_settings:
            matched_categories.append("其他")

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
