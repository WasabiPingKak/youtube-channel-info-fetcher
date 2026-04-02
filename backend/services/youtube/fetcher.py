import datetime
import logging
import os

import pytz

from services.youtube.client import get_channel_id, get_uploads_playlist_id, get_youtube_service
from services.youtube.videos import fetch_video_details, get_video_ids_from_playlist
from utils.youtube_utils import get_video_type


def get_video_data(
    date_ranges=None, input_channel=None, limit_pages: int | None = None
) -> list[dict]:
    api_key = os.getenv("API_KEY")

    if not api_key:
        raise OSError("❌ 未設定 API_KEY 環境變數")
    if not input_channel:
        raise OSError("❌ 未設定 INPUT_CHANNEL 環境變數")

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

    video_ids = get_video_ids_from_playlist(youtube, playlist_id, max_pages=limit_pages)
    if not video_ids:
        logging.warning("⚠️ 該清單中無影片")
        return []

    all_videos = fetch_video_details(youtube, video_ids)

    if date_ranges:
        logging.info("🔎 啟用日期篩選，範圍如下：")
        for i, (start, end) in enumerate(date_ranges):
            logging.info(f"  ⏳ 區間 {i + 1}: {start.isoformat()} ～ {end.isoformat()}")

    results = []
    skipped = 0
    for video in all_videos:
        try:
            video_type = get_video_type(video)
            if not video_type:
                skipped += 1
                continue

            # 正確轉換時區處理 publishedAt
            published_dt = datetime.datetime.strptime(
                video["snippet"]["publishedAt"], "%Y-%m-%dT%H:%M:%SZ"
            )
            published_dt = pytz.UTC.localize(published_dt).astimezone(pytz.timezone("Asia/Taipei"))

            if date_ranges and not any(start <= published_dt < end for start, end in date_ranges):
                skipped += 1
                continue

            # ✅ 保留完整影片欄位以避免資訊遺失
            results.append(video)

        except Exception as e:
            logging.error(
                "🔥 處理影片時發生錯誤（ID: %s）: %s", video.get("id", "未知"), e, exc_info=True
            )
            continue

    logging.info(f"✅ 處理完成，共取得 {len(results)} 筆，略過 {skipped} 筆")
    return results
