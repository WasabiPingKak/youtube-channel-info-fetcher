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
        return datetime.datetime.strptime(video['snippet']['publishedAt'], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=pytz.UTC)
    except Exception as e:
        logging.error("🔥 [get_video_publish_date] 解析影片日期失敗: %s", e, exc_info=True)
        return None
    except Exception as e:
        logging.error("🔥 [get_video_publish_date] 解析影片日期失敗: %s", e, exc_info=True)
        return "未知日期"

def get_video_type(video):
    try:
        if 'liveStreamingDetails' in video and 'actualEndTime' in video['liveStreamingDetails']:
            return "直播檔"
        if video['snippet'].get('liveBroadcastContent') == 'upcoming':
            return None
        duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
        if duration_minutes <= 1:
            return "Shorts"
        return "影片"
    except Exception as e:
        logging.error("🔥 [get_video_type] 判斷影片類型失敗: %s", e, exc_info=True)
        return "未知"
