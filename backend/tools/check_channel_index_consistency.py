# /backend/tools/check_channel_index_consistency.py
# --------------------------------------------------
# CLI 工具：比對 channel_index_batch 與 channel_index/{channelId} 資料是否一致
# --------------------------------------------------

import os
import sys
import logging
from pathlib import Path
from typing import List, Dict
import json
import argparse

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore

# ✅ 載入 .env.local 並設定 FIREBASE_KEY_PATH
sys.path.append(str(Path(__file__).resolve().parents[2]))
from dotenv import load_dotenv
from backend.services.firebase_init_service import init_firestore

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")
project_root = Path(__file__).resolve().parents[2]
firebase_key_path = (project_root / os.getenv("FIREBASE_KEY_PATH", "")).resolve()

os.environ["FIREBASE_KEY_PATH"] = str(firebase_key_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(firebase_key_path)

# ✅ 初始化 logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

BATCH_COLLECTION = "channel_index_batch"
INDEX_COLLECTION = "channel_index"

def fetch_all_batch_channels(db: firestore.Client) -> List[Dict]:
    logging.info("📥 正在讀取 channel_index_batch/* 所有資料...")
    result = []
    try:
        docs = db.collection(BATCH_COLLECTION).stream()
        for doc in docs:
            data = doc.to_dict()
            if not data:
                continue
            for ch in data.get("channels", []):
                result.append(ch)
        logging.info(f"✅ 共讀取 {len(result)} 筆頻道條目")
        return result
    except GoogleAPIError:
        logging.exception("❌ Firestore 存取錯誤")
        raise

def compare_documents(expected: Dict, actual: Dict) -> List[str]:
    differences = []

    # 移除不需比對的欄位（如 channel_id）
    ignored_keys = {"channel_id"}
    expected_filtered = {k: v for k, v in expected.items() if k not in ignored_keys}
    actual_filtered = {k: v for k, v in actual.items() if k not in ignored_keys}

    expected_keys = set(expected_filtered.keys())
    actual_keys = set(actual_filtered.keys())

    # 值不同的欄位
    for key in expected_keys & actual_keys:
        if expected_filtered[key] != actual_filtered[key]:
            differences.append(f"  - {key} 欄位不同：\n      🔸 預期：{expected_filtered[key]}\n      🔹 實際：{actual_filtered[key]}")

    # 遺漏欄位
    missing_keys = list(expected_keys - actual_keys)
    if missing_keys:
        differences.append(f"  - 遺漏欄位：\n      🔸 expected 包含但 actual 缺少 {missing_keys}")

    # 多餘欄位
    extra_keys = list(actual_keys - expected_keys)
    if extra_keys:
        differences.append(f"  - 多出欄位：\n      🔹 actual 包含多餘欄位 {extra_keys}")

    return differences

def check_consistency(db: firestore.Client, batch_channels: List[Dict], dry_run: bool = True) -> None:
    missing = []
    mismatched = []
    matched = 0

    for ch in batch_channels:
        channel_id = ch.get("channel_id")
        if not channel_id:
            continue

        doc_ref = db.collection("channel_index").document(channel_id)
        doc = doc_ref.get()
        if not doc.exists:
            missing.append(ch)
            continue

        firestore_data = doc.to_dict()
        differences = compare_documents(ch, firestore_data)

        if differences:
            mismatched.append({
                "channel_id": channel_id,
                "name": ch.get("name", ""),
                "differences": differences,
                "replacement": ch
            })
        else:
            matched += 1

    print("\n====== 比對結果統計 ======")
    print(f"✅ 一致筆數：{matched}")
    print(f"❌ 缺少 document：{len(missing)}")
    print(f"⚠️ 資料不一致：{len(mismatched)}")

    if missing:
        print("\n❌ 缺少 channel_index 文件如下：")
        for ch in missing:
            print(f" - {ch['channel_id']} ({ch['name']})")

    if mismatched:
        print("\n⚠️ 資料不一致如下：")
        for m in mismatched:
            print(f"\n- {m['channel_id']}（{m['name']}）")
            for diff in m["differences"]:
                print(diff)

    # 🛠 處理 missing + mismatched
    to_update = missing + [m["replacement"] for m in mismatched]

    if dry_run:
        print("\n🛠️ 預覽將修正的頻道資料（Dry Run 模式，不會實際寫入）：")
        for ch in to_update:
            print(f"\n📌 {ch['channel_id']}（{ch.get('name', '')}）")
            print(json.dumps({k: v for k, v in ch.items() if k not in {"channel_id", "joinedAt"}}, indent=2, ensure_ascii=False))
    else:
        print("\n📝 實際開始修正 Firestore 資料...")
        for ch in to_update:
            filtered_data = {k: v for k, v in ch.items() if k not in {"channel_id", "joinedAt"}}
            channel_id = ch["channel_id"]
            try:
                db.collection("channel_index").document(channel_id).set(filtered_data)
                print(f"\n✅ 已寫入：{channel_id}（{ch.get('name', '')}）")
                print(json.dumps(filtered_data, indent=2, ensure_ascii=False))
            except Exception as e:
                print(f"❌ 寫入失敗：{channel_id} - {e}")

def main():
    parser = argparse.ArgumentParser(description="比對 channel_index 與 batch 一致性")
    parser.add_argument("--fix", action="store_true", help="實際修正 Firestore 資料")
    args = parser.parse_args()

    try:
        db = init_firestore()
        batch_channels = fetch_all_batch_channels(db)
        check_consistency(db, batch_channels, dry_run=not args.fix)
    except Exception as e:
        logging.error(f"❌ 執行過程中發生錯誤：{e}")


if __name__ == "__main__":
    main()
