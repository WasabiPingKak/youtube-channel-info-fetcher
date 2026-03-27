# /backend/tools/print_sync_index_channel_ids.py

import argparse
import logging
import os
import sys
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

DOC_PATH = "channel_sync_index/index_list"
DEFAULT_EXPORT_FILENAME = "channel_index_list.txt"


def main():
    parser = argparse.ArgumentParser(
        description="列出 channel_sync_index/index_list 內所有 channel_id"
    )
    parser.add_argument(
        "--export",
        nargs="?",
        const=DEFAULT_EXPORT_FILENAME,
        help="將 channel_id 匯出為文字檔（可選擇檔名）",
    )
    args = parser.parse_args()

    try:
        db = init_firestore()
        doc_ref = db.document(DOC_PATH)
        doc = doc_ref.get()
        if not doc.exists:
            logging.error(f"❌ 找不到文件 {DOC_PATH}")
            return

        data = doc.to_dict()
        channels = data.get("channels")
        if not isinstance(channels, list):
            logging.error("❌ 'channels' 欄位不存在或不是陣列")
            return

        logging.info(f"✅ 成功載入 channels，共 {len(channels)} 筆")

        channel_ids = [item.get("channel_id") for item in channels if item.get("channel_id")]
        for cid in channel_ids:
            print(cid)

        if args.export is not None:
            export_path = Path(args.export).resolve()
            with export_path.open("w", encoding="utf-8") as f:
                for cid in channel_ids:
                    f.write(cid + "\n")
            logging.info(f"📄 已匯出 channel_id 至 {export_path}")

    except GoogleAPIError:
        logging.exception("❌ Firestore 存取錯誤")
    except Exception as e:
        logging.exception(f"❌ 程式執行中斷：{e}")


if __name__ == "__main__":
    main()
