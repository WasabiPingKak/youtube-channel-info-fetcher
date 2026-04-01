# utils/date_based_cache_cleaner.py
import logging
from datetime import UTC, datetime, timedelta

from google.cloud.firestore import Client

# 📋 全部清除規則表
CLEANUP_RULES = {
    "live": {
        "live_redirect_notifications": 7,
        "live_redirect_notify_queue": 7,  # 舊 collection（過渡期後移除）
        "live_redirect_cache": 7,
    },
    "trending_games": {
        "trending_games_daily": 60,
    },
}


def clean_all_expired_documents(db: Client, mode: str, cache_type: str) -> dict:
    """
    清除指定類型的快取資料。

    Args:
        db: Firestore client（由呼叫端注入）
        mode: 'dry-run' 或 'execute'
        cache_type: 'live' 或 'trending_games'
    Returns:
        dict: { collection_name: { toDelete, toKeep, error? }, ... }
    """
    now = datetime.now(UTC)

    if cache_type not in CLEANUP_RULES:
        raise ValueError(f"不支援的快取類型: {cache_type}")

    type_rules = CLEANUP_RULES[cache_type]
    results = {}

    for collection_name, days_to_keep in type_rules.items():
        cutoff_date = (now - timedelta(days=days_to_keep)).date()
        docs_to_delete = []
        docs_to_keep = []

        try:
            collection_ref = db.collection(collection_name)
            all_docs = collection_ref.list_documents()
        except Exception as e:
            logging.error(f"❌ 無法讀取集合 {collection_name}：{e}")
            results[collection_name] = {"error": str(e), "toDelete": [], "toKeep": []}
            continue

        for doc_ref in all_docs:
            doc_id = doc_ref.id
            try:
                # 支援 "YYYY-MM-DD" 與 "YYYY-MM-DD_xxx" 兩種格式
                date_part = doc_id[:10]
                doc_date = datetime.strptime(date_part, "%Y-%m-%d").date()
                if doc_date < cutoff_date:
                    docs_to_delete.append(doc_id)
                else:
                    docs_to_keep.append(doc_id)
            except ValueError:
                logging.warning(f"⚠️ 忽略無法解析為日期的文件 ID：{doc_id}")
                docs_to_keep.append(doc_id)
            except Exception as e:
                logging.error(f"❌ 分析文件 ID {doc_id} 時發生錯誤：{e}")
                docs_to_keep.append(doc_id)

        if mode == "execute":
            logging.info(f"🗑️ 準備刪除 {collection_name} 中 {len(docs_to_delete)} 筆過期文件...")
            logging.info(f"📋 {collection_name} 將刪除文件 ID：{docs_to_delete}")
            try:
                for i in range(0, len(docs_to_delete), 500):
                    batch = db.batch()
                    for doc_id in docs_to_delete[i : i + 500]:
                        try:
                            doc_ref = collection_ref.document(doc_id)
                            batch.delete(doc_ref)
                        except Exception as e:
                            logging.error(f"❌ 加入刪除文件 {doc_id} 失敗：{e}")
                    batch.commit()
                logging.info(f"✅ 已從 {collection_name} 成功刪除 {len(docs_to_delete)} 筆文件")
            except Exception as e:
                logging.error(f"❌ 刪除 {collection_name} 文件時發生錯誤：{e}")

        results[collection_name] = {"toDelete": docs_to_delete, "toKeep": docs_to_keep}

    return results
