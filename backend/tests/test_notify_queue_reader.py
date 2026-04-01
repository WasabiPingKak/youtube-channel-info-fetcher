"""
notify_queue_reader 測試：從 live_redirect_notify_queue 讀取待處理影片
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_queue_doc(data):
    doc = MagicMock()
    doc.to_dict.return_value = data
    return doc


NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=UTC)


class TestGetPendingVideoIds:
    def test_returns_unprocessed_videos(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        today_doc = _make_queue_doc(
            {
                "videos": [
                    {"videoId": "v1", "notifiedAt": "2025-06-15T10:00:00Z"},
                    {"videoId": "v2", "notifiedAt": "2025-06-15T11:00:00Z", "processedAt": "done"},
                ]
            }
        )
        yesterday_doc = _make_queue_doc({"videos": []})

        mock_db.collection.return_value.document.return_value.get.side_effect = [
            yesterday_doc,
            today_doc,
        ]

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        video_ids = [v["videoId"] for v in result]
        assert "v1" in video_ids
        assert "v2" not in video_ids  # 已處理

    def test_force_includes_processed(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        today_doc = _make_queue_doc(
            {
                "videos": [
                    {"videoId": "v1", "processedAt": "2025-06-15T10:00:00Z"},
                ]
            }
        )
        yesterday_doc = _make_queue_doc({"videos": []})
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            yesterday_doc,
            today_doc,
        ]

        result = get_pending_video_ids(mock_db, force=True, now=NOW)
        assert len(result) == 1

    def test_deduplicates_by_video_id_keeps_newer(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        yesterday_doc = _make_queue_doc(
            {
                "videos": [
                    {"videoId": "v1", "notifiedAt": "2025-06-14T08:00:00Z"},
                ]
            }
        )
        today_doc = _make_queue_doc(
            {
                "videos": [
                    {"videoId": "v1", "notifiedAt": "2025-06-15T10:00:00Z"},
                ]
            }
        )
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            yesterday_doc,
            today_doc,
        ]

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert len(result) == 1
        assert result[0]["notifiedAt"] == "2025-06-15T10:00:00Z"

    def test_skips_entries_without_video_id(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        today_doc = _make_queue_doc(
            {
                "videos": [
                    {"notifiedAt": "2025-06-15T10:00:00Z"},  # 無 videoId
                    {"videoId": "v1", "notifiedAt": "2025-06-15T10:00:00Z"},
                ]
            }
        )
        yesterday_doc = _make_queue_doc({"videos": []})
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            yesterday_doc,
            today_doc,
        ]

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert len(result) == 1

    def test_empty_queue(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        empty_doc = _make_queue_doc({})
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            empty_doc,
            empty_doc,
        ]

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert result == []
