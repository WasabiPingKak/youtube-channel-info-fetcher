# /backend/tools/migrate_channel_index_to_batch_0.py
# ---------------------------------------------------
# 此腳本為一次性 CLI 工具，用於將現有 channel_index 文件整理為 batch_0
# ✅ 本地開發時 Firestore 憑證路徑由 .env.local 載入
# ✅ 為確保從任意資料夾執行都能找到正確檔案，以下處理過程務必留意：
#
# 📁 目錄結構假設：
#   /backend/tools/migrate_channel_index_to_batch_0.py  ← 目前檔案位置
#   /backend/.env.local                                ← 放置環境變數
#   /backend/firebase-key.json                         ← Firebase service account 金鑰
#
# 📌 注意事項：
# 1. 因 python CLI 工具是從 /backend/tools 執行，若 .env.local 中設定的是相對路徑
#    （如 backend/firebase-key.json），會被解析成錯誤路徑（tools/backend/...）
#    故需轉為絕對路徑再寫回 os.environ
# 2. 為了能匯入 backend.services 內部模組（如 firebase_init_service.py），需將專案根目錄加入 sys.path
# ---------------------------------------------------

import sys
import os
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")

project_root = Path(__file__).resolve().parents[2]
firebase_key_path = (project_root / os.getenv("FIREBASE_KEY_PATH", "")).resolve()

os.environ["FIREBASE_KEY_PATH"] = str(firebase_key_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(firebase_key_path)

print("🔧 絕對 FIREBASE_KEY_PATH =", os.environ["FIREBASE_KEY_PATH"])

import os
print("🔧 GOOGLE_APPLICATION_CREDENTIALS =", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
print("🔧 FIREBASE_KEY_PATH =", os.getenv("FIREBASE_KEY_PATH"))

import logging
import argparse

from typing import List
from google.cloud import firestore
from google.api_core.exceptions import GoogleAPIError
from backend.services.firebase_init_service import init_firestore


# ✅ 初始化 logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

# ✅ collection 設定
INDEX_COLLECTION = "channel_index"
BATCH_DOC_PATH = "channel_index_batch/batch_0"
MAX_BATCH_SIZE = 1000


def fetch_all_channel_index(db) -> List[dict]:
    logging.info("📥 開始讀取 channel_index/* 文件...")
    all_channels = []
    try:
        docs = db.collection(INDEX_COLLECTION).stream()
        for doc in docs:
            data = doc.to_dict()
            if not data:
                continue
            data["channel_id"] = doc.id  # 加入頻道 ID
            all_channels.append(data)
    except GoogleAPIError:
        logging.exception("❌ Firestore 存取錯誤")
        raise
    logging.info(f"✅ 成功讀取 {len(all_channels)} 筆頻道資料")
    return all_channels


def write_to_batch_0(db, channels: List[dict], dry_run: bool = False):
    if len(channels) > MAX_BATCH_SIZE:
        raise ValueError(f"❌ 頻道數量超過 {MAX_BATCH_SIZE}，請自行分批處理")

    batch_doc = db.document(BATCH_DOC_PATH)

    if dry_run:
        logging.info("🚧 [Dry Run] 模式啟用，以下是預計寫入的資料：")
        for ch in channels:
            logging.info(f"📌 {ch['channel_id']} - {ch['name']}")
        logging.info("✅ Dry Run 模擬結束，未實際寫入 Firestore。")
        return

    try:
        batch_doc.set({
            "channels": channels,
            "updatedAt": firestore.SERVER_TIMESTAMP,  # 雖然建議用 firestore.SERVER_TIMESTAMP，也可用這種方式
        })
        logging.info(f"✅ 寫入 batch_0 成功，共 {len(channels)} 筆")
    except GoogleAPIError:
        logging.exception("❌ 寫入 batch_0 時發生錯誤")
        raise

def main():
    parser = argparse.ArgumentParser(description="將 channel_index 資料移轉至 batch_0")
    parser.add_argument("--dry-run", action="store_true", help="只顯示模擬結果，不寫入資料")
    args = parser.parse_args()

    try:
        db = init_firestore()
        channels = fetch_all_channel_index(db)
        write_to_batch_0(db, channels, dry_run=args.dry_run)
    except Exception as e:
        logging.error(f"❌ 遷移流程中斷：{e}")

if __name__ == "__main__":
    main()
