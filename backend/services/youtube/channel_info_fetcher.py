import logging
import os

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def fetch_channel_basic_info(channel_id: str) -> dict:
    """
    從 YouTube Data API v3 抓取頻道的名稱與頭像 URL。
    回傳格式：
    {
        "channel_id": "UCxxxx",
        "name": "頻道名稱",
        "thumbnail": "https://yt3.ggpht.com/..."
    }
    """
    api_key = os.getenv("API_KEY")
    if not api_key:
        raise OSError("❌ 未設定 API_KEY 環境變數")

    try:
        youtube = build("youtube", "v3", developerKey=api_key)
        response = youtube.channels().list(part="snippet", id=channel_id).execute()

        items = response.get("items", [])
        if not items:
            raise ValueError(f"📭 找不到頻道：{channel_id}")

        snippet = items[0]["snippet"]

        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("maxres", {}).get("url")
            or thumbnails.get("high", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or ""
        )

        return {
            "channel_id": channel_id,
            "name": snippet.get("title", "").strip(),
            "thumbnail": thumbnail_url,
        }

    except HttpError as e:
        logging.exception(f"❌ YouTube API 呼叫失敗：{e}")
        raise

    except Exception:
        logging.exception(f"❌ 頻道資訊抓取失敗：{channel_id}")
        raise
