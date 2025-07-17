import logging
import re
from typing import List, Dict, Any

def normalize(text: str) -> str:
    # 移除 @某人ID（如 @wasabi_pingkak）
    text = re.sub(r"@\w+", "", text)
    # 轉小寫並去除空白與全形空白
    return text.lower().replace(" ", "").replace("　", "")

def tokenize_title(title: str) -> set[str]:
    """
    拆分英文、數字詞彙為 token set（保留底線、句號、冒號、減號、破折號）。
    中文不處理，僅回傳英文/數字 token。
    """
    clean_title = re.sub(r"@\w+", "", title).lower()

    # 改用 regex 將符合條件的詞彙擷取出來，允許中間包含 _ . : - —
    # \w 包含 a-zA-Z0-9_，我們手動補上 . : -
    tokens = re.findall(r"[a-z0-9_.:\-–—]{2,}", clean_title)

    english_tokens = set(tokens)

    logging.debug("🧱 tokenize_title | raw_title=%s", title)
    logging.debug("🧱 tokenize_title | clean_title=%s", clean_title)
    logging.debug("🧱 tokenize_title | tokens=%s", english_tokens)

    return english_tokens

def keyword_in_title(keyword: str, tokens: set[str], raw_title: str) -> bool:
    """
    根據關鍵字類型使用不同策略：
    - 英文/數字（含混合）：比對 tokens（字詞集合）
    - 其他語言（例如中文）：使用 in 直接檢查原始標題（未 normalize）
    並印出詳細 log
    """
    kw_lower = keyword.lower()

    if re.fullmatch(r"[a-z0-9]{2,}", kw_lower):
        result = kw_lower in tokens
        logging.debug("🔎 keyword_in_title | keyword=%s | type=EN | tokens=%s | result=%s", keyword, tokens, result)
    else:
        result = keyword.lower() in raw_title.lower()
        logging.debug("🔎 keyword_in_title | keyword=%r | raw_title=%r | result=%s", keyword, raw_title, result)

    return result


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

        title_tokens = tokenize_title(title)
        logging.debug("🔍 [match] 處理影片標題: %s", title)
        logging.debug("🔍 [match] tokens: %s", title_tokens)

        type_key = TYPE_MAP.get(video_type, video_type)
        category_settings = settings.get(type_key, {})
        logging.debug("📁 [match] 類型分類設定: %s", list(category_settings.keys()))

        # ────────────────────────────────────────────────
        # 1️⃣ 非遊戲分類比對
        # ────────────────────────────────────────────────
        for main_category, subcategories in category_settings.items():
            if main_category == "遊戲":
                continue

            if not isinstance(subcategories, dict):
                logging.warning("⚠️ [%s] 不是 dict 結構，略過（可能是舊格式）", main_category)
                continue

            for sub_name, keywords in subcategories.items():
                hit_keywords = []

                if keyword_in_title(sub_name, title_tokens, title):
                    hit_keywords.append(sub_name)

                for kw in keywords:
                    if keyword_in_title(kw, title_tokens, title):
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
        # 2️⃣ 遊戲分類比對
        # ────────────────────────────────────────────────
        game_entries = category_settings.get("遊戲", {})
        matched_game_name: str | None = None
        hit_keywords: List[str] = []

        if isinstance(game_entries, dict):
            for game_name, keywords in game_entries.items():
                all_keywords = keywords + [game_name]
                local_hits = []

                for kw in all_keywords:
                    if keyword_in_title(kw, title_tokens, title):
                        local_hits.append(kw)

                if local_hits:
                    matched_game_name = game_name
                    matched_keywords.extend(local_hits)
                    hit_keywords = local_hits
                    matched_pairs.append({
                        "main": "遊戲",
                        "keyword": game_name,
                        "hitKeywords": hit_keywords
                    })
                    logging.debug("🎮 命中遊戲 [%s] via keywords %s", game_name, local_hits)
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
