"""
📄 fetch_channel_info.py

根據 channel_list.txt 中的頻道 ID，查詢每個 YouTube 頻道的名稱與頭像，
並將其寫入 Firestore 的 channel_data/{channel_id}/channel_info/info 文件中。

✅ 預設不會覆蓋已存在資料，如需強制覆蓋請加上 --force

使用方式：
------------
# 安裝相依套件
pip install -r requirements.txt

# 執行腳本
python fetch_channel_info.py
python fetch_channel_info.py --force

需準備：
- .env 檔案，設定 YOUTUBE_API_KEY 與 FIREBASE_KEY_PATH
- channel_list.txt：一行一個 channel ID
"""

import argparse
import os
import requests
from google.cloud import firestore
from google.oauth2 import service_account
from dotenv import load_dotenv

# ✅ 載入環境變數與初始化
load_dotenv()
API_KEY = os.getenv("API_KEY")
FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", "firebase-key.json")

if not API_KEY:
    raise EnvironmentError("❌ 請在 .env 設定 YOUTUBE_API_KEY")

# ✅ 初始化 Firestore
credentials = service_account.Credentials.from_service_account_file(FIREBASE_KEY_PATH)
db = firestore.Client(credentials=credentials)

# ✅ YouTube API 查詢函式
def fetch_channel_info_batch(channel_ids):
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {
        "part": "snippet",
        "id": ",".join(channel_ids),
        "key": API_KEY
    }
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    return resp.json().get("items", [])

# ✅ 主執行函式
def process_channels(force=False):
    with open("channel_list.txt", "r", encoding="utf-8") as f:
        all_ids = [line.strip() for line in f if line.strip()]

    BATCH_SIZE = 50
    total = len(all_ids)
    print(f"📦 共有 {total} 筆頻道要處理，開始查詢...")

    for i in range(0, total, BATCH_SIZE):
        batch_ids = all_ids[i:i+BATCH_SIZE]
        print(f"🔍 處理第 {i+1} ~ {i+len(batch_ids)} 筆")

        try:
            channels = fetch_channel_info_batch(batch_ids)
            for item in channels:
                channel_id = item["id"]
                name = item["snippet"]["title"]
                thumbnail = item["snippet"]["thumbnails"].get("high", {}).get("url") \
                            or item["snippet"]["thumbnails"].get("medium", {}).get("url") \
                            or item["snippet"]["thumbnails"].get("default", {}).get("url")
                url = f"https://www.youtube.com/channel/{channel_id}"

                doc_ref = db.collection("channel_data").document(channel_id).collection("channel_info").document("info")

                if not force and doc_ref.get().exists:
                    print(f"⏩ 已存在，略過：{channel_id}")
                    continue

                doc_ref.set({
                    "name": name,
                    "url": url,
                    "thumbnail": thumbnail
                })
                print(f"✅ 已寫入：{channel_id} - {name}")

        except Exception as e:
            print(f"❌ 發生錯誤：{e}")

# ✅ CLI 參數處理
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="初始化頻道基本資訊（名稱與頭像）到 Firestore")
    parser.add_argument("--force", action="store_true", help="強制覆蓋已存在的資料")
    args = parser.parse_args()

    process_channels(force=args.force)
