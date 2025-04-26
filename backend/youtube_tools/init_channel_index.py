"""
📄 init_channel_index.py

從 channel_list.txt 讀取頻道 ID，將 channel_info 資料轉寫到 channel_index/{channel_id}。
預設會跳過不存在的來源資料。

✅ 會將 UCLxa0YOtqi8IR5r2dSLXPng 設為 priority=1，其餘為 100。
✅ 寫入內容為 name、url、thumbnail、enabled、priority
✅ 不會寫入 updatedAt

使用方式：
------------
# 安裝相依套件
pip install -r requirements.txt

# 執行腳本
python init_channel_index.py

需準備：
- .env.local（包含 FIREBASE_KEY_PATH）
- channel_list.txt：每行一個頻道 ID
"""

import os
from pathlib import Path
from google.cloud import firestore
from google.oauth2 import service_account
from dotenv import load_dotenv

# ✅ 載入環境變數與初始化
load_dotenv("../.env.local")
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", os.path.join(BASE_DIR, "firebase-key.json"))

# ✅ 初始化 Firestore
credentials = service_account.Credentials.from_service_account_file(FIREBASE_KEY_PATH)
db = firestore.Client(credentials=credentials)

SPECIAL_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng"

def load_channel_ids():
    path = "channel_list.txt"
    if not os.path.exists(path):
        raise FileNotFoundError(f"❌ 找不到檔案：{path}")

    ids = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if not line.startswith("UC"):
                print(f"⚠️ 無效頻道 ID（略過）：{line}")
                continue
            ids.append(line)

    if not ids:
        raise ValueError("❌ channel_list.txt 中沒有有效頻道 ID")
    return ids

def main():
    channel_ids = load_channel_ids()
    print(f"📋 共載入 {len(channel_ids)} 個頻道 ID\n")

    for channel_id in channel_ids:
        info_ref = db.collection("channel_data").document(channel_id).collection("channel_info").document("info")
        snapshot = info_ref.get()

        if not snapshot.exists:
            print(f"⚠️ 來源資料不存在，略過：{channel_id}")
            continue

        info = snapshot.to_dict()
        name = info.get("name")
        thumbnail = info.get("thumbnail")
        url = info.get("url")

        if not all([name, thumbnail, url]):
            print(f"⚠️ 欄位不完整，略過：{channel_id}")
            continue

        priority = 1 if channel_id == SPECIAL_CHANNEL_ID else 100

        index_data = {
            "name": name,
            "thumbnail": thumbnail,
            "url": url,
            "enabled": True,
            "priority": priority,
        }

        index_ref = db.collection("channel_index").document(channel_id)
        existing = index_ref.get()

        if existing.exists and existing.to_dict() == index_data:
            print(f"⏩ 無變更，略過：{channel_id}")
        else:
            index_ref.set(index_data)
            print(f"✅ 已寫入 channel_index/{channel_id}（priority={priority}）")

    print("\n🎉 頻道 index 同步完成")

if __name__ == "__main__":
    main()
