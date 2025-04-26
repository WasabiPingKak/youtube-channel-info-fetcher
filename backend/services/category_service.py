import logging

def get_all_categories(db):
    try:
        categories_ref = db.collection("categories").stream()
        return [
            {
                "id": cat.id,
                "category": cat.to_dict().get("name", "未命名"),
                "keywords": cat.to_dict().get("keywords", [])
            }
            for cat in categories_ref
        ]
    except Exception:
        logging.error("🔥 [get_all_categories] 讀取分類時發生錯誤", exc_info=True)
        return []

def sync_category(db, item):
    try:
        name = item.get("name")
        keywords = item.get("keywords", [])
        mode = item.get("mode", "sync")
        if not name or not isinstance(keywords, list):
            logging.warning("⚠️ [sync_category] 傳入資料格式錯誤: %s", item)
            return

        existing = db.collection("categories").where("name", "==", name).get()
        if existing:
            doc = existing[0]
            if mode == "replace":
                db.collection("categories").document(doc.id).update({"keywords": keywords})
            else:
                current = set(doc.to_dict().get("keywords", []))
                merged = list(current.union(set(keywords)))
                if merged != current:
                    db.collection("categories").document(doc.id).update({"keywords": merged})
        else:
            db.collection("categories").add({"name": name, "keywords": keywords})
    except Exception:
        logging.error("🔥 [sync_category] 同步分類 %s 時發生錯誤", item.get("name", "未知"), exc_info=True)