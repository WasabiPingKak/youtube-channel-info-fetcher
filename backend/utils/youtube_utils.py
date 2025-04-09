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
        live_details = video.get('liveStreamingDetails', {})
        broadcast_status = video['snippet'].get('liveBroadcastContent')

        # ❌ 排除：正在直播
        if 'actualStartTime' in live_details and 'actualEndTime' not in live_details:
            return None

        # ❌ 排除：即將直播 / 即將首播
        if broadcast_status == 'upcoming':
            return None

        # ✅ 直播檔
        if 'actualStartTime' in live_details and 'actualEndTime' in live_details:
            # 檢查是否為首播（根據發佈時間接近直播開始時間）
            try:
                actual_start = datetime.datetime.strptime(
                    live_details['actualStartTime'], "%Y-%m-%dT%H:%M:%SZ"
                ).replace(tzinfo=pytz.UTC)
                published_at = datetime.datetime.strptime(
                    video['snippet']['publishedAt'], "%Y-%m-%dT%H:%M:%SZ"
                ).replace(tzinfo=pytz.UTC)
                time_diff = abs((actual_start - published_at).total_seconds())

                if time_diff < 60:
                    # ✅ 首播影片（算作一般影片）
                    duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
                    if duration_minutes <= 1:
                        return "Shorts"
                    return "影片"
                else:
                    return "直播檔"
            except Exception as time_err:
                logging.warning("⚠️ [get_video_type] 無法比較時間差: %s", time_err)

        # ✅ Shorts
        duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
        if duration_minutes <= 1:
            return "Shorts"

        # ✅ 一般影片
        return "影片"

    except Exception as e:
        logging.error("🔥 [get_video_type] 判斷影片類型失敗: %s", e, exc_info=True)
        return "未知"
