import json
from google.cloud import firestore
from pathlib import Path

from core.constants import FIRESTORE_CONFIG_PATH, get_config_default_path
from core.log_setup import logger

def init_config_if_absent(db: firestore.Client, channel_id: str, channel_name: str = "") -> None:
    """
    若 channel_data/{channel_id}/settings/config 不存在，則寫入預設 config。
    """
    doc_path = FIRESTORE_CONFIG_PATH.format(channel_id=channel_id)
    doc_ref = db.document(doc_path)

    if doc_ref.get().exists:
        logger.info(f"{channel_id} {channel_name} 🚫略過預設 settings/config ")
        return

    default_path = Path(get_config_default_path())
    logger.debug(f"[Config] 準備讀取預設設定檔：{default_path}")
    if not default_path.exists():
        logger.error(f"❌ 找不到預設設定檔: {default_path}")
        raise FileNotFoundError(f"❌ 找不到預設設定檔: {default_path}")

    with open(default_path, "r", encoding="utf-8") as f:
        default_config = json.load(f)

    doc_ref.set(default_config)
    logger.info(f"{channel_id} {channel_name} ✅預設 settings/config 寫入成功")
