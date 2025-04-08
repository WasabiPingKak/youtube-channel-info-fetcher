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
