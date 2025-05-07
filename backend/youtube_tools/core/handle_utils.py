import json
from typing import Dict, List
from pathlib import Path

from core.constants import HANDLE_REGEX, HANDLES_FILE, CACHE_FILE
from core.youtube_api import resolve_handle_to_id
from core.log_setup import logger


def parse_and_resolve_channel_ids(api) -> List[str]:
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
        cid = resolve_handle_to_id(api, h)
        if cid:
            handle_cache[h] = cid
            channel_ids[channel_ids.index(h)] = cid
            logger.info("[解析完成] %s → %s", h, cid)
        else:
            logger.error("[解析失敗] %s", h)

    # 儲存快取
    CACHE_FILE.write_text(json.dumps(handle_cache, ensure_ascii=False, indent=2), encoding="utf-8")

    # 去重 + 過濾非 UC
    channel_ids = list(dict.fromkeys([cid for cid in channel_ids if cid.startswith("UC")]))
    logger.info("待處理頻道：%d", len(channel_ids))
    return channel_ids
