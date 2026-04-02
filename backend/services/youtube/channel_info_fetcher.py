import logging
import os

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from services.youtube.client import _TracedHttp
from utils.breaker_instances import youtube_breaker
from utils.circuit_breaker import circuit_breaker
from utils.retry import retry_on_transient_error

try:
    from opentelemetry import trace

    _tracer = trace.get_tracer(__name__)
except ImportError:
    _tracer = None


@circuit_breaker(youtube_breaker)
@retry_on_transient_error(max_retries=3, base_delay=1.0)
def _fetch_channel_snippet(api_key: str, channel_id: str):
    """帶 retry + 熔斷保護的頻道資訊 API 請求"""
    yt = build("youtube", "v3", developerKey=api_key, http=_TracedHttp())
    req = yt.channels().list(part="snippet", id=channel_id)
    if _tracer:
        with _tracer.start_as_current_span(
            "youtube.api",
            attributes={"rpc.service": "youtube", "rpc.method": "youtube.channels.list"},
        ):
            return req.execute()
    return req.execute()


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
        response = _fetch_channel_snippet(api_key, channel_id)

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
