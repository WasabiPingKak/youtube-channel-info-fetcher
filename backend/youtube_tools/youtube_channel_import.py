"""
youtube_channel_import.py
-----------------
一鍵腳本，可執行以下流程：
  1. 從 `channel_list_handle.txt` 讀取 YouTube 頻道網址或 @handle
  2. 解析為 UC 前綴的頻道 ID（使用 handle_cache.json 快取）
  3. 透過 YouTube Data API v3 取得頻道名稱與頭像
  4. 寫入 / 更新：
     - channel_data/{channel_id}/channel_info/info
     - channel_index/{channel_id}
     - channel_data/{channel_id}/settings/config（若不存在則初始化）
  5. 在終端輸出成功 / 失敗摘要
  6. 將完整細節寫入 youtube_channel_import.log

執行腳本
-----------------
python youtube_channel_import.py
"""

from __future__ import annotations

import argparse
import sys
from typing import Dict, List
from pathlib import Path
from google.cloud import firestore
from dotenv import load_dotenv

from core.log_setup import logger
from core.handle_utils import parse_and_resolve_channel_ids
from core.youtube_api import (
    build_youtube_service,
    fetch_channels_info
)
from core.constants import (
    get_api_key, get_firebase_key_path,
    LOG_FILE,
    FIRESTORE_INFO_PATH, FIRESTORE_INDEX_COLLECTION, SPECIAL_CHANNEL_ID,
)
from core.firestore_writer import init_firestore_client, needs_update_info
from core.config_initializer import init_config_if_absent

# ---------------------------------------------------------------------------#
# 📂 載入環境變數
# ---------------------------------------------------------------------------#
if not load_dotenv("../.env.local"):
    load_dotenv(".env.local")

YOUTUBE_API_KEY = get_api_key()
FIREBASE_KEY_PATH = get_firebase_key_path()

# ---------------------------------------------------------------------------#
# 參數
# ---------------------------------------------------------------------------#
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="將 YouTube 頻道資訊匯入 Firestore。")
    parser.add_argument("--force", action="store_true", default=False, help="即使資料未變更亦強制更新")
    return parser.parse_args()

# ---------------------------------------------------------------------------#
# 主流程
# ---------------------------------------------------------------------------#
def main():
    if not YOUTUBE_API_KEY or not Path(FIREBASE_KEY_PATH).exists():
        logger.critical("❌ 環境變數缺少 YOUTUBE_API_KEY 或找不到 FIREBASE_KEY_PATH，請檢查設定")
        sys.exit(1)

    args = parse_args()
    youtube = build_youtube_service(YOUTUBE_API_KEY)
    fs_client = init_firestore_client()

    # 處理 handle 與快取 → 回傳 UC ID 清單
    channel_ids = parse_and_resolve_channel_ids(youtube)

    # 取得頻道資訊
    info_map = fetch_channels_info(youtube, channel_ids)

    success, failed = [], []
    result_map: Dict[str, Dict[str, str]] = {}

    for cid in channel_ids:
        status = "🚫略過"
        data = info_map.get(cid)
        if not data:
            logger.error("⚠️ 無法取得頻道資訊：%s", cid)
            failed.append(cid)
            continue

        # 準備 Firestore 寫入資料
        data_to_write = {
            **data,
            "url": f"https://www.youtube.com/channel/{cid}",
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        info_ref = fs_client.document(FIRESTORE_INFO_PATH.format(channel_id=cid))
        try:
            existing = info_ref.get().to_dict() if info_ref.get().exists else None
            if args.force or needs_update_info(existing, data_to_write):
                info_ref.set(data_to_write)
                status = "✅已更新"
        except Exception as e:
            logger.error("[Info] 寫入失敗 %s：%s", cid, e)
            failed.append(cid)
            continue

        # channel_index
        index_ref = fs_client.collection(FIRESTORE_INDEX_COLLECTION).document(cid)
        index_data = {
            "name": data["name"],
            "thumbnail": data["thumbnail"],
            "url": f"https://www.youtube.com/channel/{cid}",
            "enabled": True,
            "priority": 1 if cid == SPECIAL_CHANNEL_ID else 100,
        }
        try:
            if args.force or not index_ref.get().exists or index_ref.get().to_dict() != index_data:
                index_ref.set(index_data)
                status = "✅已更新"
        except Exception as e:
            logger.error("[Index] 寫入失敗 %s：%s", cid, e)
            failed.append(cid)
            continue

        # ✅ 新增邏輯：初始化 settings/config（如果不存在）
        try:
            init_config_if_absent(fs_client, cid, data["name"])
        except Exception as e:
            logger.warning("[Config] 初始化失敗 %s：%s", cid, e)

        logger.info("[結果] %s %s [%s]", cid, data["name"], status)
        success.append(cid)
        result_map[cid] = {"name": data["name"], "status": status}

    # 匯出摘要
    logger.info("----- 匯入摘要 -----")
    logger.info("成功：%d", len(success))
    logger.info("失敗：%d", len(failed))
    logger.info("-------------------")

    print("\n===== 匯入摘要 =====")
    print(f"成功：{len(success)}")
    print(f"失敗：{len(failed)}")
    if success:
        print("成功 ID：")
        for cid in success:
            info = result_map[cid]
            print(f"  - {cid} {info['name']} {info['status']}")
    if failed:
        print("失敗 ID / handle：")
        for cid in failed:
            print(f"  - {cid}")
    print(f"\n詳細日誌已寫入 {LOG_FILE}")

if __name__ == "__main__":
    main()
