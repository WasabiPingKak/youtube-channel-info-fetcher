import logging

from google.api_core.exceptions import GoogleAPIError
from google.cloud.firestore import Client

logger = logging.getLogger(__name__)


def document_exists(db: Client, path: str) -> bool:
    try:
        parts = path.split("/")
        doc_ref = db.collection(parts[0])
        for i in range(1, len(parts) - 1, 2):
            doc_ref = doc_ref.document(parts[i]).collection(parts[i + 1])
        doc = doc_ref.document(parts[-1]).get()
        return doc.exists  # type: ignore[reportAttributeAccessIssue]
    except GoogleAPIError as e:
        logger.warning("⚠️ 無法檢查文件是否存在 [%s]: %s", path, e)
        return False


def write_document(db: Client, path: str, data: dict) -> None:
    try:
        parts = path.split("/")
        doc_ref = db.collection(parts[0])
        for i in range(1, len(parts) - 1, 2):
            doc_ref = doc_ref.document(parts[i]).collection(parts[i + 1])
        doc_ref.document(parts[-1]).set(data)
    except GoogleAPIError as e:
        logger.error("❌ 寫入文件失敗 [%s]: %s", path, e, exc_info=True)
