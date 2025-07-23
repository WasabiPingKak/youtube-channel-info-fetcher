import json
import logging
import os
from pathlib import Path
from google.cloud import firestore
from google.api_core.exceptions import GoogleAPIError
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timezone

db = firestore.Client()

FIRESTORE_CONFIG_PATH = "channel_data/{channel_id}/settings/config"
FIRESTORE_INFO_PATH = "channel_data/{channel_id}/channel_info/info"
FIRESTORE_INDEX_COLLECTION = "channel_index"
DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "config" / "default_config.json"
SPECIAL_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng"
YOUTUBE_API_KEY = os.getenv("API_KEY")

def init_config_if_absent(channel_id: str, channel_name: str = "") -> None:
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

        with open(config_path, "r", encoding="utf-8") as f:
            default_config = json.load(f)

        doc_ref.set(default_config)
        logging.info(f"[Config] ✅ 寫入預設設定成功：{channel_id} {channel_name}")

    except GoogleAPIError as e:
        logging.exception(f"[Config] ❌ Firestore 存取錯誤：{channel_id}")
        raise

    except Exception as e:
        logging.exception(f"[Config] ❌ 初始化設定失敗：{channel_id}")
        raise

def run_channel_initialization(channel_id: str):
    logging.info(f"[Init] 🔄 開始初始化頻道：{channel_id}")

    if not YOUTUBE_API_KEY:
        raise Exception("未設定 YOUTUBE_API_KEY")

    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        response = youtube.channels().list(
            part="snippet,statistics",
            id=channel_id
        ).execute()

        items = response.get("items", [])
        if not items:
            raise Exception("找不到頻道資訊，請確認 channelId 是否正確")

        snippet = items[0]["snippet"]

        # 📸 取得最大可用縮圖
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("maxres", {}).get("url") or
            thumbnails.get("high", {}).get("url") or
            thumbnails.get("default", {}).get("url")
        )

        info_data = {
            "name": snippet.get("title"),
            "thumbnail": thumbnail_url,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "url": f"https://www.youtube.com/channel/{channel_id}",
            "enabled": False,
        }

        # ✅ 初始化設定（如尚未存在）
        init_config_if_absent(channel_id, info_data["name"])

        append_channel_to_batch(channel_id, info_data)

        logging.info(f"[Init] 🎉 頻道初始化完成：{channel_id}")

    except HttpError as e:
        logging.exception(f"[Init] ❌ YouTube API 呼叫失敗：{e}")
        raise

    except Exception as e:
        logging.exception(f"[Init] ❌ 初始化流程錯誤：{channel_id}")
        raise

def append_channel_to_batch(channel_id: str, info_data: dict):
    try:
        logging.info(f"[Batch] 🚀 開始處理 channel_index_batch 寫入：{channel_id}")
        root_ref = db.collection("channel_index_batch")
        docs = list(root_ref.stream())
        logging.info(f"[Batch] 📦 讀取到 {len(docs)} 個 batch 文件")

        # 先檢查是否已存在於任何 batch（包含 batch_0）
        for doc in docs:
            data = doc.to_dict()
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
                except Exception:
                    logging.warning(f"[Batch] ❓ 無法解析 batch ID：{doc.id}")

            last_batch_id = f"batch_{max_batch_number or 1}"
            last_batch_ref = root_ref.document(last_batch_id)
            last_batch_data = last_batch_ref.get().to_dict() or {}
            current_channels = last_batch_data.get("channels", [])
            logging.info(f"[Batch] 📌 準備寫入：{last_batch_id}（目前 {len(current_channels)} 筆）")

            # 若已滿 1000 筆，開新 batch
            if len(current_channels) >= 1000:
                last_batch_id = f"batch_{max_batch_number + 1}"
                last_batch_ref = root_ref.document(last_batch_id)
                current_channels = []
                logging.info(f"[Batch] 🔄 上一 batch 已滿，建立新 batch：{last_batch_id}")

            now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            new_entry = {
                "channel_id": channel_id,
                "name": info_data["name"],
                "thumbnail": info_data["thumbnail"],
                "url": info_data["url"],
                "enabled": False,
                "priority": 1 if channel_id == SPECIAL_CHANNEL_ID else 100,
                "joinedAt": now_iso
            }

            current_channels.append(new_entry)
            last_batch_ref.set({
                "channels": current_channels,
                "updatedAt": firestore.SERVER_TIMESTAMP
            })
            logging.info(f"[Batch] ✅ 寫入成功：{channel_id} → {last_batch_id}（總筆數：{len(current_channels)}）")

        # ✍️ 寫入 channel_index/{channel_id}（若不存在）
        index_ref = db.document(f"channel_index/{channel_id}")
        if not index_ref.get().exists:
            index_ref.set(info_data)
            logging.info(f"[Index] ✅ 寫入 channel_index 成功：{channel_id}")
        else:
            logging.info(f"[Index] ⚠️ channel_index/{channel_id} 已存在，略過寫入")

    except Exception:
        logging.exception(f"[Batch] ❌ 寫入 batch 索引或 channel_index 失敗：{channel_id}")
