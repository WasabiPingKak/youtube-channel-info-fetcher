"""
Firestore 客戶端單例模式
確保整個應用程式使用相同的 Firestore 資料庫連線
"""
from services.firebase_init_service import init_firestore

_db_instance = None


def get_firestore_client():
    """
    取得 Firestore 客戶端單例

    Returns:
        firestore.Client: Firestore 客戶端實例
    """
    global _db_instance
    if _db_instance is None:
        _db_instance = init_firestore()
    return _db_instance
