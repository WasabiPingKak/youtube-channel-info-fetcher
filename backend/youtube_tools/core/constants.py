import os
import re
from pathlib import Path

# 📁 專案根目錄
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

# 🔑 延遲讀取環境變數
def get_api_key() -> str | None:
    return os.getenv("API_KEY")

def get_firebase_key_path() -> str:
    return os.getenv("FIREBASE_KEY_PATH", os.path.join(BASE_DIR, "firebase-key.json"))

# 📄 檔案與快取路徑
HANDLES_FILE = Path("channel_list_handle.txt")
CACHE_FILE = Path("handle_cache.json")
LOG_FILE = Path("youtube_channel_import.log")

# 📦 Firestore 寫入目標路徑
FIRESTORE_INFO_PATH = "channel_data/{channel_id}/channel_info/info"
FIRESTORE_INDEX_COLLECTION = "channel_index"
FIRESTORE_CONFIG_PATH = "channel_data/{channel_id}/settings/config"

# 預設設定檔的本地路徑（假設你放在根目錄）
def get_config_default_path() -> str:
    return "config_default.json"

# 🔒 特殊頻道 ID（例如後台固定設定頻道）
SPECIAL_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng"

# 🌐 YouTube API 設定
YT_CHANNELS_ENDPOINT_PARTS = "snippet"
YT_CHANNELS_MAX_BATCH = 50

# 🔍 Handle 格式比對（如 @channelhandle 或 channel ID）
HANDLE_REGEX = re.compile(
    r"(?:https?://)?(?:www\.)?youtube\.com/(?:(?:channel/)?(?P<id>UC[0-9A-Za-z_-]{22,})|@?(?P<handle>[A-Za-z0-9_.-]+))/?"
)
