from typing import Dict, List
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from core.constants import YT_CHANNELS_ENDPOINT_PARTS, YT_CHANNELS_MAX_BATCH
from core.log_setup import logger

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
