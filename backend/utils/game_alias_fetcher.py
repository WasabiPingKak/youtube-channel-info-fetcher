import os
import time
import requests
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# ✅ API Endpoint
ALIAS_API_URL = os.getenv("GAME_ALIAS_ENDPOINT")
if not ALIAS_API_URL:
    logger.error("❌ GAME_ALIAS_ENDPOINT 尚未設定，請檢查 .env.game_alias")
    raise EnvironmentError("❌ GAME_ALIAS_ENDPOINT 尚未設定")

# ✅ 快取區
_cache: Dict[str, List[str]] = {}
_last_fetch_time: float = 0
_CACHE_TTL = 3600  # 一小時（秒）

def fetch_global_alias_map(force_refresh: bool = False) -> Dict[str, List[str]]:
    """
    從 Google Apps Script 抓取遊戲別名 JSON，使用記憶體快取。
    """
    global _cache, _last_fetch_time
    now = time.time()

    if not force_refresh and _cache and (now - _last_fetch_time < _CACHE_TTL):
        logger.debug("♻️ 使用快取遊戲別名，共 %d 筆", len(_cache))
        return _cache

    logger.debug("🌐 向 Google Sheet API 發送請求：%s", ALIAS_API_URL)
    try:
        res = requests.get(ALIAS_API_URL, timeout=30)
        res.raise_for_status()
        data = res.json()

        if not isinstance(data, dict):
            raise ValueError("回傳格式錯誤，預期為 dict")

        _cache = data
        _last_fetch_time = now
        logger.info("✅ 成功抓取遊戲別名 JSON，共 %d 筆", len(data))
    except Exception as e:
        logger.warning("⚠️ 無法取得遊戲別名，使用快取資料。原因：%s", e)

    return _cache
