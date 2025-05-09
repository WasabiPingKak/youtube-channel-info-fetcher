import isodate
import datetime
import pytz
import logging

def convert_duration_to_hms(duration):
    try:
        parsed = isodate.parse_duration(duration)
        total_seconds = int(parsed.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        total_minutes = (hours * 60) + minutes + (seconds / 60)
        total_minutes = round(total_minutes, 1) if total_minutes < 1 else int(total_minutes)
        return f"{hours:02}:{minutes:02}:{seconds:02}", total_minutes
    except Exception as e:
        logging.error("🔥 [convert_duration_to_hms] 轉換影片長度失敗: %s", e, exc_info=True)
        return "00:00:00", 0

def get_video_publish_date(video):
    try:
        if 'liveStreamingDetails' in video and 'actualStartTime' in video['liveStreamingDetails']:
            return datetime.datetime.strptime(
                video['liveStreamingDetails']['actualStartTime'], "%Y-%m-%dT%H:%M:%SZ"
            ).replace(tzinfo=pytz.UTC)
        return datetime.datetime.strptime(
            video['snippet']['publishedAt'], "%Y-%m-%dT%H:%M:%SZ"
        ).replace(tzinfo=pytz.UTC)
    except Exception as e:
        logging.error("🔥 [get_video_publish_date] 解析影片日期失敗: %s", e, exc_info=True)
        return None

def get_video_type(video):
    try:
        # ✅ 若影片已經有 "type" 欄位（快取格式），直接使用它
        if "type" in video:
            logging.debug("📦 [get_video_type] 使用快取格式 type=%s | videoId=%s", video["type"], video.get("videoId"))
            return video["type"]

        # ✅ 原始格式處理邏輯（YouTube API）
        live_details = video.get('liveStreamingDetails', {})
        broadcast_status = video['snippet'].get('liveBroadcastContent')

        video_id = video.get("id")
        published_at = video['snippet'].get("publishedAt")
        has_start = 'actualStartTime' in live_details
        has_end = 'actualEndTime' in live_details

        # ❌ 排除：正在直播
        if has_start and not has_end:
            logging.debug("🛑 [get_video_type] 排除: 正在直播 | videoId=%s", video_id)
            return None

        # ❌ 排除：即將直播 / 首播
        if broadcast_status == 'upcoming':
            logging.debug("🛑 [get_video_type] 排除: 尚未開始 | videoId=%s", video_id)
            return None

        # ✅ 直播檔 或 首播
        if has_start and has_end:
            try:
                actual_start = datetime.datetime.strptime(
                    live_details['actualStartTime'], "%Y-%m-%dT%H:%M:%SZ"
                ).replace(tzinfo=pytz.UTC)
                published_dt = datetime.datetime.strptime(
                    published_at, "%Y-%m-%dT%H:%M:%SZ"
                ).replace(tzinfo=pytz.UTC)
                time_diff = abs((actual_start - published_dt).total_seconds())

                if time_diff < 300:
                    duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
                    result = "Shorts" if duration_minutes <= 1 else "影片"
                else:
                    result = "直播檔"

                logging.debug("🔹 [get_video_type] 回傳: %s | videoId=%s | diff=%.1fs | broadcast=%s | hasStart=%s | hasEnd=%s | published=%s",
                             result, video_id, time_diff, broadcast_status, has_start, has_end, published_at)
                return result

            except Exception as time_err:
                logging.warning("⚠️ [get_video_type] 無法比較時間差: %s", time_err)

        # ✅ Shorts fallback
        duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
        result = "Shorts" if duration_minutes <= 1 else "影片"
        logging.debug("🔹 [get_video_type] 回傳: %s | videoId=%s | fallback | broadcast=%s | hasStart=%s | hasEnd=%s | published=%s",
                     result, video_id, broadcast_status, has_start, has_end, published_at)
        return result

    except Exception as e:
        logging.error("🔥 [get_video_type] 判斷影片類型失敗: %s", e, exc_info=True)
        return "未知"

def normalize_video_item(video):
    try:
        # ✅ 已清洗格式（無 snippet）
        if "snippet" not in video and "videoId" in video:
            required_keys = ["videoId", "title", "publishDate", "duration", "type"]
            if all(k in video for k in required_keys):
                return {
                    "videoId": video["videoId"],
                    "title": video["title"],
                    "publishDate": video["publishDate"],
                    "duration": video["duration"],
                    "type": video["type"]
                }
            else:
                logging.warning("⚠️ [normalize_video_item] 清洗後影片缺欄位: %s", video)
                return None

        # ✅ 原始 YouTube API 格式
        video_id = video.get("id")
        title = video.get("snippet", {}).get("title")
        publish_date = get_video_publish_date(video)
        duration_iso = video.get("contentDetails", {}).get("duration")
        duration = int(isodate.parse_duration(duration_iso).total_seconds()) if duration_iso else None
        video_type = get_video_type(video)

        logging.debug("📄 [normalize_video_item] 處理影片: %s | 類型: %s | 標題: %s", video_id, video_type, title)

        if not video_id or not title or not publish_date or not video_type:
            return None

        return {
            "videoId": video_id,
            "title": title,
            "publishDate": publish_date.isoformat(),
            "duration": duration,
            "type": video_type
        }

    except Exception as e:
        logging.warning("⚠️ [normalize_video_item] 無法轉換影片資料: %s", video, exc_info=True)
        return None
