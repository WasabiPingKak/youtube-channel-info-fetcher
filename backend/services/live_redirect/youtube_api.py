# services/live_redirect/youtube_api.py

import os
import logging
import requests
from requests.exceptions import RequestException

YOUTUBE_API_KEY = os.getenv("API_KEY")
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos"

def batch_fetch_video_details(video_ids: list[str]) -> list[dict]:
    if not YOUTUBE_API_KEY:
        logging.error("❌ 環境變數 API_KEY 未設定")
        return []

    results = []

    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        params = {
            "part": "snippet,liveStreamingDetails,status",
            "id": ",".join(batch),
            "key": YOUTUBE_API_KEY
        }

        try:
            logging.info(f"🌐 查詢 YouTube API：{batch}")
            resp = requests.get(YOUTUBE_API_URL, params=params)
            resp.raise_for_status()
            items = resp.json().get("items", [])
            results.extend(items)
            logging.info(f"📦 成功取得 {len(items)} 筆影片資訊")
        except RequestException as e:
            logging.warning(f"⚠️ 查詢失敗：{e}")

    return results
