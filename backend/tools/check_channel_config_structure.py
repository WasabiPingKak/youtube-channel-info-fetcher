# /backend/tools/check_channel_config_structure.py

import sys
import os
import logging
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")

project_root = Path(__file__).resolve().parents[2]
firebase_key_path = (project_root / os.getenv("FIREBASE_KEY_PATH", "")).resolve()
os.environ["FIREBASE_KEY_PATH"] = str(firebase_key_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(firebase_key_path)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

from google.api_core.exceptions import GoogleAPIError
from backend.services.firebase_init_service import init_firestore

CHANNEL_LIST_PATH = "channel_index_list.txt"
TARGET_KEYS = {"live", "shorts", "videos"}

def main():
    parser = argparse.ArgumentParser(description="檢查並選擇性清除頻道 config 結構")
    parser.add_argument("--clear", action="store_true", help="清空符合條件的 config 文件內容")
    args = parser.parse_args()

    try:
        file_path = Path(CHANNEL_LIST_PATH)
        if not file_path.exists():
            logging.error(f"❌ 找不到檔案：{CHANNEL_LIST_PATH}")
            return

        with file_path.open("r", encoding="utf-8") as f:
            channel_ids = [line.strip() for line in f if line.strip()]

        if not channel_ids:
            logging.warning("⚠️ 檔案為空，無任何頻道 ID")
            return

        db = init_firestore()
        logging.info(f"🔍 開始檢查 {len(channel_ids)} 個頻道的 config 結構...")

        for channel_id in channel_ids:
            doc_path = f"channel_data/{channel_id}/settings/config"
            try:
                doc_ref = db.document(doc_path)
                doc = doc_ref.get()
                if not doc.exists:
                    continue
                config = doc.to_dict()
                if not isinstance(config, dict):
                    continue

                if any(key in config for key in TARGET_KEYS):
                    print(channel_id)
                    if args.clear:
                        doc_ref.set({})
                        logging.info(f"🧹 已清空 {channel_id} 的 config")

            except GoogleAPIError:
                logging.warning(f"⚠️ 無法讀取或修改 {channel_id} 的 config")
                continue

    except Exception as e:
        logging.exception(f"❌ 程式執行失敗：{e}")

if __name__ == "__main__":
    main()
