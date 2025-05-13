import json
import logging
import os
from pathlib import Path
from google.cloud import firestore
from google.api_core.exceptions import GoogleAPIError
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

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
        }

        # ✍️ 寫入 channel_info/info
        info_ref = db.document(FIRESTORE_INFO_PATH.format(channel_id=channel_id))
        info_ref.set(info_data)
        logging.info(f"[Init] ✅ 寫入 channel_info/info 成功：{channel_id}")

        # ✍️ 寫入 channel_index
        index_ref = db.collection(FIRESTORE_INDEX_COLLECTION).document(channel_id)
        index_data = {
            "name": info_data["name"],
            "thumbnail": info_data["thumbnail"],
            "url": info_data["url"],
            "enabled": True,
            "priority": 1 if channel_id == SPECIAL_CHANNEL_ID else 100,
        }

        existing = index_ref.get().to_dict() if index_ref.get().exists else None
        if existing != index_data:
            index_ref.set(index_data)
            logging.info(f"[Index] ✅ channel_index 已更新：{channel_id}")
        else:
            logging.info(f"[Index] 🔁 channel_index 無變化，略過：{channel_id}")

        # ✅ 初始化設定（如尚未存在）
        init_config_if_absent(channel_id, info_data["name"])

        logging.info(f"[Init] 🎉 頻道初始化完成：{channel_id}")

    except HttpError as e:
        logging.exception(f"[Init] ❌ YouTube API 呼叫失敗：{e}")
        raise

    except Exception as e:
        logging.exception(f"[Init] ❌ 初始化流程錯誤：{channel_id}")
        raise
