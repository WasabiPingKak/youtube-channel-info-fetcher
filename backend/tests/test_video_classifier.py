"""
Video classifier 測試：直播/預約/過期/非直播的分類邏輯
"""

from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest


def _make_item(
    video_id="vid1",
    channel_id="UCxxxxxxxxxxxxxxxxxxxxxxx",
    actual_start=None,
    scheduled_start=None,
    actual_end=None,
    privacy="public",
    concurrent_viewers=None,
    has_live_details=True,
):
    item = {
        "id": video_id,
        "snippet": {"channelId": channel_id, "title": "Test Stream"},
        "status": {"privacyStatus": privacy},
    }
    if has_live_details:
        ld = {}
        if actual_start:
            ld["actualStartTime"] = actual_start
        if scheduled_start:
            ld["scheduledStartTime"] = scheduled_start
        if actual_end:
            ld["actualEndTime"] = actual_end
        if concurrent_viewers is not None:
            ld["concurrentViewers"] = str(concurrent_viewers)
        item["liveStreamingDetails"] = ld
    else:
        item["liveStreamingDetails"] = {}
    return item


def _mock_db_with_channel(exists=True, name="TestCh", thumbnail="thumb.jpg"):
    db = MagicMock()
    doc = MagicMock()
    doc.exists = exists
    doc.to_dict.return_value = {
        "name": name,
        "thumbnail": thumbnail,
        "badge": "gold",
        "countryCode": ["TW"],
    }
    db.collection.return_value.document.return_value.get.return_value = doc
    return db


class TestClassifyVideo:
    """classify_video 分類邏輯"""

    def test_non_live_video_returns_none(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T12:00:00+00:00")
        item = _make_item(has_live_details=False)
        assert classify_video(db, item, now) is None

    def test_live_stream_in_progress(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T12:30:00+00:00")
        item = _make_item(actual_start="2025-06-01T12:00:00+00:00")

        result = classify_video(db, item, now)
        assert result is not None
        assert result["live"]["videoId"] == "vid1"
        assert result["live"]["isUpcoming"] is False

    def test_upcoming_stream(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T12:00:00+00:00")
        # 預約在 30 分鐘後
        scheduled = "2025-06-01T12:30:00+00:00"
        item = _make_item(scheduled_start=scheduled)

        result = classify_video(db, item, now)
        assert result is not None
        assert result["live"]["isUpcoming"] is True

    def test_expired_waiting_room_returns_none(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T13:00:00+00:00")
        # 預約在 30 分鐘前但從未開播
        scheduled = "2025-06-01T12:00:00+00:00"
        item = _make_item(scheduled_start=scheduled)

        result = classify_video(db, item, now)
        assert result is None

    def test_ended_stream(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T14:00:00+00:00")
        item = _make_item(
            actual_start="2025-06-01T12:00:00+00:00",
            actual_end="2025-06-01T13:00:00+00:00",
        )

        result = classify_video(db, item, now)
        assert result is not None
        assert result["live"]["endTime"] == "2025-06-01T13:00:00+00:00"

    def test_unknown_channel_returns_none(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel(exists=False)
        now = datetime.fromisoformat("2025-06-01T12:30:00+00:00")
        item = _make_item(actual_start="2025-06-01T12:00:00+00:00")

        result = classify_video(db, item, now)
        assert result is None

    def test_private_ended_stream_gets_synthetic_end_time(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T14:00:00+00:00")
        item = _make_item(
            actual_start="2025-06-01T12:00:00+00:00",
            privacy="private",
        )

        result = classify_video(db, item, now)
        assert result is not None
        assert result["live"]["endTime"] is not None

    def test_concurrent_viewers_parsed(self):
        from services.live_redirect.video_classifier import classify_video

        db = _mock_db_with_channel()
        now = datetime.fromisoformat("2025-06-01T12:30:00+00:00")
        item = _make_item(
            actual_start="2025-06-01T12:00:00+00:00",
            concurrent_viewers=1234,
        )

        result = classify_video(db, item, now)
        assert result["live"]["viewers"] == 1234
