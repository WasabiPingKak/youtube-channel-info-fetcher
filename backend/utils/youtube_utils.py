import isodate
import datetime
import pytz

def convert_duration_to_hms(duration):
    parsed = isodate.parse_duration(duration)
    total_seconds = int(parsed.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    total_minutes = (hours * 60) + minutes + (seconds / 60)
    total_minutes = round(total_minutes, 1) if total_minutes < 1 else int(total_minutes)
    return f"{hours:02}:{minutes:02}:{seconds:02}", total_minutes

def get_video_publish_date(video):
    dt = datetime.datetime.fromisoformat(video['snippet']['publishedAt'][:-1])
    local_dt = dt.astimezone(pytz.timezone("Asia/Taipei"))
    return local_dt.strftime("%Y/%m/%d")

def get_video_type(video):
    if 'liveStreamingDetails' in video and 'actualEndTime' in video['liveStreamingDetails']:
        return "直播檔"
    if video['snippet'].get('liveBroadcastContent') == 'upcoming':
        return None
    duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
    if duration_minutes <= 1:
        return "Shorts"
    return "影片"