import logging

def categorize_title_by_keywords(title, db):
    try:
        matched = []
        for doc in db.collection("categories").stream():
            cat = doc.to_dict()
            if any(kw in title for kw in cat.get("keywords", [])):
                matched.append(cat.get("name"))
        return matched
    except Exception:
        logging.error("🔥 [categorize_title_by_keywords] 分類標題時發生錯誤：%s", title, exc_info=True)
        return []

def match_category_and_game(video_title: str, video_type: str, settings: dict = None) -> dict:
    print("🎯 [categorizer] match_category_and_game called")
    """
    假分類邏輯，供部署階段使用，總是回傳「其他」分類與空遊戲。
    """
    return {
        "category": "其他",
        "game": None,
        "keywords": []
    }