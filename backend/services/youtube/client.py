import logging

import googleapiclient.discovery
import googleapiclient.errors

from utils.breaker_instances import youtube_breaker
from utils.circuit_breaker import circuit_breaker
from utils.retry import retry_on_transient_error


@circuit_breaker(youtube_breaker)
@retry_on_transient_error(max_retries=3, base_delay=1.0)
def _execute_api_request(request):
    """包裝 googleapiclient request.execute()，加入 retry + 熔斷保護"""
    return request.execute()


def get_youtube_service(api_key):
    try:
        return googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)
    except googleapiclient.errors.HttpError as e:
        logging.error("🔥 [get_youtube_service] 建立 YouTube API 服務失敗: %s", e, exc_info=True)
        return None


def get_channel_id(youtube, input_channel):
    if input_channel.startswith("UC"):
        return input_channel

    username = input_channel[1:] if input_channel.startswith("@") else input_channel
    try:
        request = youtube.search().list(part="snippet", q=username, type="channel", maxResults=1)
        response = _execute_api_request(request)
        if response["items"]:
            return response["items"][0]["snippet"]["channelId"]
        else:
            logging.warning("⚠️ [get_channel_id] 找不到頻道: %s", input_channel)
            return None
    except googleapiclient.errors.HttpError as err:
        logging.error("🔥 [get_channel_id] HTTP 錯誤: %s", err, exc_info=True)
        return None
    except Exception as e:
        logging.error("🔥 [get_channel_id] 發生未預期錯誤: %s", e, exc_info=True)
        return None


def get_uploads_playlist_id(youtube, channel_id):
    try:
        request = youtube.channels().list(part="contentDetails", id=channel_id)
        response = _execute_api_request(request)
        items = response.get("items", [])
        if not items:
            logging.warning("⚠️ [get_uploads_playlist_id] 找不到頻道內容，頻道 ID: %s", channel_id)
            return None
        return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]
    except googleapiclient.errors.HttpError as e:
        logging.error(
            "🔥 [get_uploads_playlist_id] 無法取得上傳清單（頻道 ID: %s）: %s",
            channel_id,
            e,
            exc_info=True,
        )
        return None
