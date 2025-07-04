# utils/live_cache_cleaner.py
from google.cloud.firestore import Client
from datetime import datetime, timedelta, timezone
import logging

def run_live_cache_cleaner(mode: str) -> dict:
    db = Client()

    now = datetime.now(timezone.utc)
    cutoff_date = (now - timedelta(days=7)).date().isoformat()  # YYYY-MM-DD

    collections = {
        "live_redirect_notify_queue": [],
        "live_redirect_cache": []
    }

    results = {}

    for collection_name in collections.keys():
        docs_to_delete = []
        docs_to_keep = []

        try:
            collection_ref = db.collection(collection_name)
            all_docs = collection_ref.list_documents()
        except Exception as e:
            logging.error(f"❌ 無法讀取集合 {collection_name}：{e}")
            results[collection_name] = {
                "error": str(e),
                "toDelete": [],
                "toKeep": []
            }
            continue  # 跳過這個集合

        for doc_ref in all_docs:
            doc_id = doc_ref.id
            try:
                # 檢查是否為合法日期格式
                doc_date = datetime.strptime(doc_id, "%Y-%m-%d").date()
                if doc_date < datetime.strptime(cutoff_date, "%Y-%m-%d").date():
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
            logging.info(f"🗑️ 將從 {collection_name} 刪除 {len(docs_to_delete)} 筆文件...")
            try:
                for i in range(0, len(docs_to_delete), 500):
                    batch = db.batch()
                    for doc_id in docs_to_delete[i:i+500]:
                        try:
                            doc_ref = collection_ref.document(doc_id)
                            batch.delete(doc_ref)
                        except Exception as e:
                            logging.error(f"❌ 加入刪除文件 {doc_id} 失敗：{e}")
                    batch.commit()
                logging.info(f"✅ 已成功從 {collection_name} 刪除 {len(docs_to_delete)} 筆文件")
            except Exception as e:
                logging.error(f"❌ 刪除 {collection_name} 文件時發生錯誤：{e}")

        results[collection_name] = {
            "toDelete": docs_to_delete,
            "toKeep": docs_to_keep
        }

    return results
