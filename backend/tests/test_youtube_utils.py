"""
youtube_utils 測試：影片時間解析、類型判斷、資料正規化
"""

import pytz

from utils.youtube_utils import (
    convert_duration_to_hms,
    get_video_publish_date,
    get_video_type,
    normalize_video_item,
)


class TestConvertDurationToHms:
    def test_normal_duration(self):
        hms, minutes = convert_duration_to_hms("PT1H30M45S")
        assert hms == "01:30:45"
        assert minutes == 90

    def test_short_duration(self):
        hms, minutes = convert_duration_to_hms("PT30S")
        assert hms == "00:00:30"
        assert minutes == 0.5

    def test_zero_duration(self):
        hms, minutes = convert_duration_to_hms("PT0S")
        assert hms == "00:00:00"
        assert minutes == 0

    def test_invalid_duration(self):
        hms, minutes = convert_duration_to_hms("invalid")
        assert hms == "00:00:00"
        assert minutes == 0

    def test_minutes_only(self):
        hms, minutes = convert_duration_to_hms("PT5M")
        assert hms == "00:05:00"
        assert minutes == 5


class TestGetVideoPublishDate:
    def test_uses_actual_start_time_if_available(self):
        video = {
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z"},
            "liveStreamingDetails": {"actualStartTime": "2026-03-01T12:00:00Z"},
        }
        result = get_video_publish_date(video)
        assert result.hour == 12

    def test_falls_back_to_published_at(self):
        video = {"snippet": {"publishedAt": "2026-03-01T10:00:00Z"}}
        result = get_video_publish_date(video)
        assert result.hour == 10
        assert result.tzinfo == pytz.UTC

    def test_returns_none_on_error(self):
        video = {"snippet": {}}
        result = get_video_publish_date(video)
        assert result is None


class TestGetVideoType:
    def test_cached_type_field(self):
        video = {"type": "直播檔", "videoId": "v1"}
        assert get_video_type(video) == "直播檔"

    def test_live_streaming_in_progress(self):
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z", "liveBroadcastContent": "live"},
            "liveStreamingDetails": {"actualStartTime": "2026-03-01T10:00:00Z"},
            "contentDetails": {"duration": "PT1H"},
        }
        assert get_video_type(video) is None  # 正在直播 → 排除

    def test_upcoming_broadcast(self):
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z", "liveBroadcastContent": "upcoming"},
            "contentDetails": {"duration": "PT0S"},
        }
        assert get_video_type(video) is None

    def test_completed_stream(self):
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-01-01T10:00:00Z", "liveBroadcastContent": "none"},
            "liveStreamingDetails": {
                "actualStartTime": "2026-03-01T10:00:00Z",
                "actualEndTime": "2026-03-01T12:00:00Z",
            },
            "contentDetails": {"duration": "PT2H"},
        }
        assert get_video_type(video) == "直播檔"

    def test_premiere_video(self):
        """首播：actualStartTime ≈ publishedAt（差距 < 300 秒）"""
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z", "liveBroadcastContent": "none"},
            "liveStreamingDetails": {
                "actualStartTime": "2026-03-01T10:00:10Z",
                "actualEndTime": "2026-03-01T10:30:00Z",
            },
            "contentDetails": {"duration": "PT30M"},
        }
        assert get_video_type(video) == "影片"

    def test_shorts(self):
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z", "liveBroadcastContent": "none"},
            "contentDetails": {"duration": "PT30S"},
        }
        assert get_video_type(video) == "Shorts"

    def test_regular_video(self):
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z", "liveBroadcastContent": "none"},
            "contentDetails": {"duration": "PT10M"},
        }
        assert get_video_type(video) == "影片"

    def test_error_returns_unknown(self):
        assert get_video_type({}) == "未知"

    def test_premiere_shorts(self):
        """首播但時長 <= 1 分鐘 → Shorts"""
        video = {
            "id": "v1",
            "snippet": {"publishedAt": "2026-03-01T10:00:00Z", "liveBroadcastContent": "none"},
            "liveStreamingDetails": {
                "actualStartTime": "2026-03-01T10:00:00Z",
                "actualEndTime": "2026-03-01T10:00:30Z",
            },
            "contentDetails": {"duration": "PT30S"},
        }
        assert get_video_type(video) == "Shorts"


class TestNormalizeVideoItem:
    def test_already_cleaned_format(self):
        video = {
            "videoId": "v1",
            "title": "test",
            "publishDate": "2026-03-01",
            "duration": 600,
            "type": "影片",
        }
        result = normalize_video_item(video)
        assert result["videoId"] == "v1"
        assert result["type"] == "影片"

    def test_cleaned_format_missing_keys(self):
        video = {"videoId": "v1", "title": "test"}
        result = normalize_video_item(video)
        assert result is None

    def test_youtube_api_format(self):
        video = {
            "id": "v1",
            "snippet": {
                "title": "test video",
                "publishedAt": "2026-03-01T10:00:00Z",
                "liveBroadcastContent": "none",
            },
            "contentDetails": {"duration": "PT10M"},
        }
        result = normalize_video_item(video)
        assert result is not None
        assert result["videoId"] == "v1"
        assert result["type"] == "影片"
        assert result["duration"] == 600

    def test_returns_none_for_excluded_type(self):
        """正在直播的影片 → type=None → 不正規化"""
        video = {
            "id": "v1",
            "snippet": {
                "title": "test",
                "publishedAt": "2026-03-01T10:00:00Z",
                "liveBroadcastContent": "live",
            },
            "liveStreamingDetails": {"actualStartTime": "2026-03-01T10:00:00Z"},
            "contentDetails": {"duration": "PT0S"},
        }
        result = normalize_video_item(video)
        assert result is None

    def test_returns_none_on_exception(self):
        result = normalize_video_item(None)
        assert result is None
