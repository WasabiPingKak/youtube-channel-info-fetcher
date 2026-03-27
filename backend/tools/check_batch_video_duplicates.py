# /backend/tools/check_batch_video_duplicates.py
# --------------------------------------------------
# CLI 工具：找出 channel_data/*/videos_batch 中重複的影片 ID
# --------------------------------------------------

import argparse
import logging
import os
import sys
from collections import defaultdict
from pathlib import Path

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore

# ✅ 載入 Firestore 初始化設定
sys.path.append(str(Path(__file__).resolve().parents[2]))
from dotenv import load_dotenv

from backend.services.firebase_init_service import init_firestore

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")
project_root = Path(__file__).resolve().parents[2]
firebase_key_path = (project_root / os.getenv("FIREBASE_KEY_PATH", "")).resolve()
os.environ["FIREBASE_KEY_PATH"] = str(firebase_key_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(firebase_key_path)

# ✅ logging 設定
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")


def fetch_all_channel_ids(db: firestore.Client):
    logging.info("📦 讀取所有 channel_data/* 頻道 ID ...")
    try:
        docs = db.collection("channel_data").list_documents()
        channel_ids = [doc.id for doc in docs]
        logging.info(f"✅ 共 {len(channel_ids)} 個頻道")
        return channel_ids
    except GoogleAPIError:
        logging.exception("❌ 無法列出 channel_data documents")
        return []


def check_channel_batches(db: firestore.Client, channel_id: str, fix: bool = False):
    batch_col = db.collection("channel_data").document(channel_id).collection("videos_batch")
    batch_docs = {}
    video_locations = defaultdict(
        list
    )  # videoId -> list of (batch_index, batch_id, index_in_batch, video)

    try:
        # 讀取所有 batch 文件並建立反查表
        for doc in batch_col.stream():
            batch_id = doc.id
            if not batch_id.startswith("batch_"):
                continue
            batch_index = int(batch_id.replace("batch_", ""))
            data = doc.to_dict()
            videos = data.get("videos", [])
            batch_docs[batch_id] = videos
            for i, video in enumerate(videos):
                vid = video.get("videoId")
                if vid:
                    video_locations[vid].append((batch_index, batch_id, i, video))

        # 找出重複的 videoId
        duplicates = {vid: locs for vid, locs in video_locations.items() if len(locs) > 1}
        if not duplicates:
            return  # 無重複就不輸出

        print(f"\n====== [channel_id: {channel_id}] 重複影片檢查報告 ======")
        total_videos = sum(len(v) for v in batch_docs.values())
        print(f"✅ 總影片數：{total_videos}")
        print(f"⚠️ 發現重複影片：{len(duplicates)} 筆\n")

        # 建立保留規則：videoId -> (batch_id, index)
        vid_keep_map = {}
        for vid, entries in duplicates.items():
            # 按照 (batch_index, index_in_batch) 排序，保留最後一筆（最大者）
            entries.sort(key=lambda e: (e[0], e[2]))  # (batch_index, index)
            keep = entries[-1]
            keep_batch_id, keep_index = keep[1], keep[2]
            vid_keep_map[vid] = (keep_batch_id, keep_index)

            print(f"🔁 videoId: {vid}")
            print(f"  - 出現在：{', '.join(e[1] for e in entries)}")
            print(f"  ✅ 保留於：{keep_batch_id}")

        if fix:
            updated_count = 0
            for batch_id, videos in batch_docs.items():
                updated = []
                for i, v in enumerate(videos):
                    vid = v.get("videoId")
                    if not vid:
                        continue
                    if vid in vid_keep_map:
                        keep_batch_id, keep_index = vid_keep_map[vid]
                        if not (batch_id == keep_batch_id and i == keep_index):
                            continue  # skip, 這筆不是保留的
                    updated.append(v)

                if len(updated) != len(videos):
                    removed = len(videos) - len(updated)
                    print(f"🛠 修正 batch：{batch_id}，移除 {removed} 筆影片")
                    batch_col.document(batch_id).set({"videos": updated})
                    updated_count += 1

            if updated_count == 0:
                print("ℹ️ 無需修正任何 batch")

    except Exception as e:
        logging.error(f"❌ 無法處理頻道 {channel_id}：{e}")


def main():
    parser = argparse.ArgumentParser(
        description="找出 channel_data/{channel}/videos_batch 中重複的影片 ID"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--channel", type=str, help="指定要檢查的頻道 ID")
    group.add_argument("--all", action="store_true", help="檢查所有頻道")

    parser.add_argument("--fix", action="store_true", help="修正重複的影片，只保留最新版本")

    args = parser.parse_args()

    db = init_firestore()

    if args.channel:
        check_channel_batches(db, args.channel, fix=args.fix)
    elif args.all:
        channel_ids = fetch_all_channel_ids(db)
        for cid in channel_ids:
            check_channel_batches(db, cid, fix=args.fix)


if __name__ == "__main__":
    main()
