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
  5. 在終端輸出成功 / 失敗摘要
  6. 將完整細節寫入 youtube_channel_import.log

執行腳本
-----------------
python youtube_channel_import.py
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Dict, List

from google.cloud import firestore
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# ---------------------------------------------------------------------------#
# 📂 環境變數與路徑
# ---------------------------------------------------------------------------#
if not load_dotenv("../.env.local"):
    load_dotenv(".env.local")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

YOUTUBE_API_KEY = os.getenv("API_KEY")
FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", os.path.join(BASE_DIR, "firebase-key.json"))

# ---------------------------------------------------------------------------#
# 設定常數
# ---------------------------------------------------------------------------#
HANDLES_FILE = Path("channel_list_handle.txt")
CACHE_FILE = Path("handle_cache.json")
LOG_FILE = Path("youtube_channel_import.log")
FIRESTORE_INFO_PATH = "channel_data/{channel_id}/channel_info/info"
FIRESTORE_INDEX_COLLECTION = "channel_index"
SPECIAL_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng"

YT_CHANNELS_ENDPOINT_PARTS = "snippet"
YT_CHANNELS_MAX_BATCH = 50

# ---------------------------------------------------------------------------#
# 日誌設定
# ---------------------------------------------------------------------------#
logger = logging.getLogger("youtube_channel_import")
logger.setLevel(logging.INFO)
_fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", "%Y-%m-%d %H:%M:%S")
sh = logging.StreamHandler()
sh.setFormatter(_fmt)
logger.addHandler(sh)
fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
fh.setFormatter(_fmt)
logger.addHandler(fh)

# ---------------------------------------------------------------------------#
# 參數
# ---------------------------------------------------------------------------#
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="將 YouTube 頻道資訊匯入 Firestore。")
    parser.add_argument("--force", action="store_true", default=False, help="即使資料未變更亦強制更新")
    return parser.parse_args()

# ---------------------------------------------------------------------------#
# YouTube API
# ---------------------------------------------------------------------------#
HANDLE_REGEX = re.compile(
    r"(?:https?://)?(?:www\.)?youtube\.com/(?:(?:channel/)?(?P<id>UC[0-9A-Za-z_-]{22,})|@?(?P<handle>[A-Za-z0-9_.-]+))/?"
)

def build_youtube_service(api_key: str):
    return build("youtube", "v3", developerKey=api_key, cache_discovery=False)

def resolve_handle_to_id(api, handle: str) -> str | None:
    """
    將 @handle 轉成 UCXXXX channel ID。
    1) 先用 channels().list(forHandle=...) 精準對應
    2) 若 404 / 400，退回 search().list(q=handle) 取第一筆
    """
    cleaned = handle.lstrip("@")
    try:
        resp = api.channels().list(part="id", forHandle=cleaned).execute()
        items = resp.get("items", [])
        if items:
            return items[0]["id"]
    except HttpError as e:
        if e.resp.status not in (400, 404):
            logger.error("[forHandle 失敗] handle=%s，原因：%s", handle, e)
    except Exception as e:
        logger.error("[forHandle 例外] handle=%s，原因：%s", handle, e)

    try:
        resp = api.search().list(part="snippet", type="channel", q=handle, maxResults=1).execute()
        items = resp.get("items", [])
        if items:
            return items[0]["snippet"]["channelId"]
    except Exception as e:
        logger.error("[search 失敗] handle=%s，原因：%s", handle, e)

    return None

def pick_best_thumbnail(thumbnails: Dict) -> str:
    for key in ("maxres", "standard", "high", "medium", "default"):
        if key in thumbnails and thumbnails[key].get("url"):
            return thumbnails[key]["url"]
    return ""

def fetch_channels_info(api, ids: List[str]) -> Dict[str, Dict]:
    info: Dict[str, Dict] = {}
    for i in range(0, len(ids), YT_CHANNELS_MAX_BATCH):
        batch = ids[i : i + YT_CHANNELS_MAX_BATCH]
        try:
            resp = api.channels().list(part=YT_CHANNELS_ENDPOINT_PARTS, id=",".join(batch)).execute()
        except Exception as e:
            logger.error("[抓取失敗] 批次 %s，原因：%s", batch, e)
            continue
        for item in resp.get("items", []):
            cid = item["id"]
            snippet = item.get("snippet", {})
            info[cid] = {
                "name": snippet.get("title", ""),
                "thumbnail": pick_best_thumbnail(snippet.get("thumbnails", {})),
            }
    return info

# ---------------------------------------------------------------------------#
# Firestore
# ---------------------------------------------------------------------------#
def init_firestore_client() -> firestore.Client:
    credentials = service_account.Credentials.from_service_account_file(FIREBASE_KEY_PATH)
    return firestore.Client(credentials=credentials, project=credentials.project_id)

def needs_update_info(existing: Dict | None, new: Dict) -> bool:
    if not existing:
        return True
    return (
        existing.get("name") != new["name"]
        or existing.get("thumbnail") != new["thumbnail"]
        or existing.get("url") != new["url"]
    )

# ---------------------------------------------------------------------------#
# 主流程
# ---------------------------------------------------------------------------#
def main():
    if not YOUTUBE_API_KEY or not Path(FIREBASE_KEY_PATH).exists():
        logger.critical("❌ 環境變數缺少 YOUTUBE_API_KEY 或找不到 FIREBASE_KEY_PATH，請檢查設定")
        sys.exit(1)
    if not HANDLES_FILE.exists():
        logger.critical("❌ 找不到 %s，無法繼續", HANDLES_FILE)
        sys.exit(1)

    args = parse_args()
    youtube = build_youtube_service(YOUTUBE_API_KEY)
    fs_client = init_firestore_client()

    # 讀取快取
    handle_cache: Dict[str, str] = {}
    if CACHE_FILE.exists():
        try:
            handle_cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            logger.warning("⚠️ 快取檔案已損毀，重新初始化")

    # 解析輸入清單
    logger.info("[🔎開始解析] ------ ")
    channel_ids: List[str] = []
    for line in HANDLES_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        m = HANDLE_REGEX.match(line)
        if not m:
            logger.warning("⚠️ 無法解析：%s", line)
            continue
        cid, handle = m.group("id"), m.group("handle")
        if cid:
            channel_ids.append(cid)
        elif handle:
            channel_ids.append(handle_cache.get(handle) or handle)

    # 解析 @handle → channel ID
    for h in [h for h in channel_ids if not h.startswith("UC")]:
        cid = resolve_handle_to_id(youtube, h)
        if cid:
            handle_cache[h] = cid
            channel_ids[channel_ids.index(h)] = cid
            logger.info("[解析完成] %s → %s", h, cid)
        else:
            logger.error("[解析失敗] %s", h)

    CACHE_FILE.write_text(json.dumps(handle_cache, ensure_ascii=False, indent=2), encoding="utf-8")
    # 去重
    channel_ids = list(dict.fromkeys([cid for cid in channel_ids if cid.startswith("UC")]))
    logger.info("待處理頻道：%d", len(channel_ids))

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

        logger.info("[結果] %s %s [%s]", cid, data["name"], status)
        success.append(cid)
        result_map[cid] = {"name": data["name"], "status": status}

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
