import os
import datetime
import pytz
import logging

from services.youtube.client import get_youtube_service, get_channel_id, get_uploads_playlist_id
from services.youtube.videos import get_video_ids_from_playlist, fetch_video_details
from utils.youtube_utils import convert_duration_to_hms, get_video_publish_date, get_video_type

def get_video_data(date_ranges=None, input_channel=None):
    api_key = api_key or os.getenv("API_KEY")

    if not api_key:
        raise EnvironmentError("❌ 未設定 API_KEY 環境變數")
    if not input_channel:
        raise EnvironmentError("❌ 未設定 INPUT_CHANNEL 環境變數")

    youtube = get_youtube_service(api_key)
    if youtube is None:
        logging.error("🔥 無法建立 YouTube API 服務，結束執行")
        return []

    channel_id = get_channel_id(youtube, input_channel)
    if not channel_id:
        logging.error("🔥 無法取得頻道 ID")
        return []

    playlist_id = get_uploads_playlist_id(youtube, channel_id)
    if not playlist_id:
        logging.error("🔥 無法取得上傳清單 ID")
        return []

    video_ids = get_video_ids_from_playlist(youtube, playlist_id)
    if not video_ids:
        logging.warning("⚠️ 該清單中無影片")
        return []

    all_videos = fetch_video_details(youtube, video_ids)

    results = []
    skipped = 0
    for video in all_videos:
        try:
            video_type = get_video_type(video)
            if not video_type:
                skipped += 1
                continue

            # 正確轉換時區處理 publishedAt
            published_dt = datetime.datetime.strptime(video['snippet']['publishedAt'], "%Y-%m-%dT%H:%M:%SZ")
            published_dt = pytz.UTC.localize(published_dt).astimezone(pytz.timezone("Asia/Taipei"))

            if date_ranges and not any(start <= published_dt < end for start, end in date_ranges):
                skipped += 1
                continue

            # ✅ 保留完整影片欄位以避免資訊遺失
            results.append(video)

        except Exception as e:
            logging.error("🔥 處理影片時發生錯誤（ID: %s）: %s", video.get("id", "未知"), e, exc_info=True)
            continue

    logging.info(f"✅ 處理完成，共取得 {len(results)} 筆，略過 {skipped} 筆")
    return results
