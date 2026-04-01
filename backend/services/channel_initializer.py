import json
import logging
import os
from datetime import UTC, datetime
from pathlib import Path

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from utils.admin_ids import get_admin_channel_ids
from utils.exceptions import ConfigurationError, NotFoundError

FIRESTORE_CONFIG_PATH = "channel_data/{channel_id}/settings/config"
FIRESTORE_INFO_PATH = "channel_data/{channel_id}/channel_info/info"
FIRESTORE_INDEX_COLLECTION = "channel_index"
DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "config" / "default_config.json"


def init_config_if_absent(db: firestore.Client, channel_id: str, channel_name: str = "") -> None:
    try:
        doc_path = FIRESTORE_CONFIG_PATH.format(channel_id=channel_id)
        doc_ref = db.document(doc_path)

        if doc_ref.get().exists:
            logging.info(f"[Config] 🚫 已存在設定檔，略過：{channel_id} {channel_name}")
            return

        config_path = Path(DEFAULT_CONFIG_PATH)
        logging.debug(f"[Config] 嘗試讀取預設設定檔：{config_path.resolve()}")
        if not config_path.exists():
            logging.error(f"❌ 找不到預設設定檔: {config_path}")
            raise FileNotFoundError(f"❌ 找不到預設設定檔: {config_path}")

        with open(config_path, encoding="utf-8") as f:
            default_config = json.load(f)

        doc_ref.set(default_config)
        logging.info(f"[Config] ✅ 寫入預設設定成功：{channel_id} {channel_name}")

    except GoogleAPIError:
        logging.exception(f"[Config] ❌ Firestore 存取錯誤：{channel_id}")
        raise

    except Exception:
        logging.exception(f"[Config] ❌ 初始化設定失敗：{channel_id}")
        raise


def run_channel_initialization(db: firestore.Client, channel_id: str):
    logging.info(f"[Init] 🔄 開始初始化頻道：{channel_id}")

    api_key = os.getenv("API_KEY")
    if not api_key:
        raise ConfigurationError("未設定 YouTube API Key")

    try:
        youtube = build("youtube", "v3", developerKey=api_key)

        response = youtube.channels().list(part="snippet,statistics", id=channel_id).execute()

        items = response.get("items", [])
        if not items:
            raise NotFoundError("找不到頻道資訊，請確認 channelId 是否正確")

        snippet = items[0]["snippet"]

        # 📸 取得最大可用縮圖
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("maxres", {}).get("url")
            or thumbnails.get("high", {}).get("url")
            or thumbnails.get("default", {}).get("url")
        )

        info_data = {
            "name": snippet.get("title"),
            "thumbnail": thumbnail_url,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "url": f"https://www.youtube.com/channel/{channel_id}",
            "enabled": False,
        }

        # ✅ 初始化設定（如尚未存在）
        init_config_if_absent(db, channel_id, info_data["name"])

        append_channel_to_batch(db, channel_id, info_data)

        logging.info(f"[Init] 🎉 頻道初始化完成：{channel_id}")

    except HttpError as e:
        logging.exception(f"[Init] ❌ YouTube API 呼叫失敗：{e}")
        raise

    except Exception:
        logging.exception(f"[Init] ❌ 初始化流程錯誤：{channel_id}")
        raise


def append_channel_to_batch(db: firestore.Client, channel_id: str, info_data: dict):
    try:
        logging.info(f"[Batch] 🚀 開始處理 channel_index_batch 寫入：{channel_id}")
        root_ref = db.collection("channel_index_batch")
        docs = list(root_ref.stream())
        logging.info(f"[Batch] 📦 讀取到 {len(docs)} 個 batch 文件")

        # 先檢查是否已存在於任何 batch（包含 batch_0）
        for doc in docs:
            data = doc.to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
            channels = data.get("channels", [])
            if any(c.get("channel_id") == channel_id for c in channels):
                logging.info(f"[Batch] ⚠️ 頻道 {channel_id} 已存在於 {doc.id}，略過寫入 batch")
                break
        else:
            # 找出最後一個 batch 編號（排除 batch_0）
            valid_batches = [doc for doc in docs if doc.id != "batch_0"]
            max_batch_number = 0
            for doc in valid_batches:
                try:
                    n = int(doc.id.replace("batch_", ""))
                    if n > max_batch_number:
                        max_batch_number = n
                except ValueError:
                    logging.warning(f"[Batch] ❓ 無法解析 batch ID：{doc.id}")

            last_batch_id = f"batch_{max_batch_number or 1}"
            last_batch_ref = root_ref.document(last_batch_id)
            last_batch_data = last_batch_ref.get().to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
            current_channels = last_batch_data.get("channels", [])
            logging.info(f"[Batch] 📌 準備寫入：{last_batch_id}（目前 {len(current_channels)} 筆）")

            # 若已滿 1000 筆，開新 batch
            if len(current_channels) >= 1000:
                last_batch_id = f"batch_{max_batch_number + 1}"
                last_batch_ref = root_ref.document(last_batch_id)
                current_channels = []
                logging.info(f"[Batch] 🔄 上一 batch 已滿，建立新 batch：{last_batch_id}")

            now_iso = datetime.now(UTC).isoformat().replace("+00:00", "Z")
            new_entry = {
                "channel_id": channel_id,
                "name": info_data["name"],
                "thumbnail": info_data["thumbnail"],
                "url": info_data["url"],
                "enabled": False,
                "priority": 1 if channel_id in get_admin_channel_ids() else 100,
                "joinedAt": now_iso,
            }

            current_channels.append(new_entry)
            last_batch_ref.set(
                {"channels": current_channels, "updatedAt": firestore.SERVER_TIMESTAMP}
            )
            logging.info(
                f"[Batch] ✅ 寫入成功：{channel_id} → {last_batch_id}（總筆數：{len(current_channels)}）"
            )

        # ✍️ 寫入 channel_index/{channel_id}（若不存在）
        index_ref = db.document(f"channel_index/{channel_id}")
        if not index_ref.get().exists:
            index_ref.set(info_data)
            logging.info(f"[Index] ✅ 寫入 channel_index 成功：{channel_id}")
        else:
            logging.info(f"[Index] ⚠️ channel_index/{channel_id} 已存在，略過寫入")

    except GoogleAPIError:
        logging.exception(f"[Batch] ❌ 寫入 batch 索引或 channel_index 失敗：{channel_id}")
