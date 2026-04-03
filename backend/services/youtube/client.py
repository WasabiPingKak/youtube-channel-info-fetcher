from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import googleapiclient.discovery
import googleapiclient.errors
import httplib2

from utils.breaker_instances import youtube_breaker
from utils.circuit_breaker import circuit_breaker
from utils.request_id import get_request_id
from utils.retry import retry_on_transient_error

if TYPE_CHECKING:
    from opentelemetry.trace import Tracer

_tracer: Tracer | None
try:
    from opentelemetry import trace

    _tracer = trace.get_tracer(__name__)
except ImportError:
    _tracer = None


class _TracedHttp(httplib2.Http):
    """注入 X-Request-ID 到 google-api-python-client 的 httplib2 請求。"""

    def request(
        self, uri, method="GET", body=None, headers=None, redirections=5, connection_type=None
    ):
        if headers is None:
            headers = {}
        rid = get_request_id()
        if rid != "-":
            headers["X-Request-ID"] = rid
        return super().request(uri, method, body, headers, redirections, connection_type)


@circuit_breaker(youtube_breaker)
@retry_on_transient_error(max_retries=3, base_delay=1.0)
def _execute_api_request(request) -> dict:
    """包裝 googleapiclient request.execute()，加入 retry + 熔斷保護 + OTel span"""
    if _tracer:
        with _tracer.start_as_current_span(
            "youtube.api",
            attributes={"rpc.service": "youtube", "rpc.method": request.methodId},
        ):
            return request.execute()  # type: ignore[no-any-return]
    return request.execute()  # type: ignore[no-any-return]


def get_youtube_service(api_key) -> googleapiclient.discovery.Resource | None:
    try:
        return googleapiclient.discovery.build(
            "youtube", "v3", developerKey=api_key, http=_TracedHttp()
        )
    except googleapiclient.errors.HttpError as e:
        logging.error("🔥 [get_youtube_service] 建立 YouTube API 服務失敗: %s", e, exc_info=True)
        return None


def get_channel_id(youtube: Any, input_channel: str) -> str | None:
    if input_channel.startswith("UC"):
        return input_channel

    username = input_channel[1:] if input_channel.startswith("@") else input_channel
    try:
        request = youtube.search().list(part="snippet", q=username, type="channel", maxResults=1)
        response = _execute_api_request(request)
        if response["items"]:
            return response["items"][0]["snippet"]["channelId"]  # type: ignore[no-any-return]
        else:
            logging.warning("⚠️ [get_channel_id] 找不到頻道: %s", input_channel)
            return None
    except googleapiclient.errors.HttpError as err:
        logging.error("🔥 [get_channel_id] HTTP 錯誤: %s", err, exc_info=True)
        return None
    except Exception as e:
        logging.error("🔥 [get_channel_id] 發生未預期錯誤: %s", e, exc_info=True)
        return None


def get_uploads_playlist_id(youtube, channel_id) -> str | None:
    try:
        request = youtube.channels().list(part="contentDetails", id=channel_id)
        response = _execute_api_request(request)
        items = response.get("items", [])
        if not items:
            logging.warning("⚠️ [get_uploads_playlist_id] 找不到頻道內容，頻道 ID: %s", channel_id)
            return None
        return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]  # type: ignore[no-any-return]
    except googleapiclient.errors.HttpError as e:
        logging.error(
            "🔥 [get_uploads_playlist_id] 無法取得上傳清單（頻道 ID: %s）: %s",
            channel_id,
            e,
            exc_info=True,
        )
        return None
