# /backend/tools/upload_default_categories_config_v2.py
# ---------------------------------------------------
# CLI 工具：將 default_categories_config_v2.json 寫入 Firestore
# ✅ 從 .env.local 載入 Firebase 金鑰路徑
# ✅ 寫入 global_settings/default_categories_config_v2
# ---------------------------------------------------

import sys
import os
import json
from pathlib import Path

# ✅ 加入專案根目錄，允許匯入 backend.services
sys.path.append(str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv
from google.cloud import firestore
from backend.services.firebase_init_service import init_firestore

# ✅ 載入 .env.local，並解析 Firebase 金鑰路徑
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")
project_root = Path(__file__).resolve().parents[2]
firebase_key_path = (project_root / os.getenv("FIREBASE_KEY_PATH", "")).resolve()

os.environ["FIREBASE_KEY_PATH"] = str(firebase_key_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(firebase_key_path)

# ✅ Firestore 寫入目標
COLLECTION = "global_settings"
DOCUMENT_ID = "default_categories_config_v2"
JSON_FILE_PATH = Path(__file__).parent / "default_categories_config_v2.json"

def main():
    # ✅ 檢查檔案是否存在
    if not JSON_FILE_PATH.exists():
        print(f"❌ 找不到 JSON 設定檔：{JSON_FILE_PATH}")
        sys.exit(1)

    # ✅ 讀取 JSON 檔案
    try:
        with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
            config_data = json.load(f)
    except Exception as e:
        print(f"❌ 無法讀取 JSON 檔案：{e}")
        sys.exit(1)

    # ✅ 初始化 Firestore
    try:
        db = init_firestore()
    except Exception as e:
        print(f"❌ 初始化 Firestore 失敗：{e}")
        sys.exit(1)

    # ✅ 寫入 Firestore
    try:
        db.collection(COLLECTION).document(DOCUMENT_ID).set(config_data)
        print(f"✅ 成功寫入 {COLLECTION}/{DOCUMENT_ID} 共 {len(config_data)} 個主分類")
    except Exception as e:
        print(f"❌ Firestore 寫入失敗：{e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
