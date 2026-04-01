"""
sync_time_index 測試：lastVideoSyncAt 的讀取與更新
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from google.api_core.exceptions import GoogleAPIError


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_index_doc(exists, data=None):
    doc = MagicMock()
    doc.exists = exists
    doc.to_dict.return_value = data or {}
    return doc


class TestGetLastVideoSyncTime:
    def test_doc_not_exists_returns_none(self, mock_db):
        from services.firestore.sync_time_index import get_last_video_sync_time

        mock_db.collection.return_value.document.return_value.get.return_value = _make_index_doc(
            False
        )
        result = get_last_video_sync_time(mock_db, "UC001")
        assert result is None

    def test_channel_not_found_returns_none(self, mock_db):
        from services.firestore.sync_time_index import get_last_video_sync_time

        mock_db.collection.return_value.document.return_value.get.return_value = _make_index_doc(
            True, {"channels": [{"channel_id": "UC999"}]}
        )
        result = get_last_video_sync_time(mock_db, "UC001")
        assert result is None

    def test_string_date_parsed(self, mock_db):
        from services.firestore.sync_time_index import get_last_video_sync_time

        mock_db.collection.return_value.document.return_value.get.return_value = _make_index_doc(
            True,
            {
                "channels": [
                    {
                        "channel_id": "UC001",
                        "lastVideoSyncAt": "2025-06-01T12:00:00Z",
                    }
                ]
            },
        )
        result = get_last_video_sync_time(mock_db, "UC001")
        assert isinstance(result, datetime)
        assert result.year == 2025

    def test_firestore_timestamp_converted(self, mock_db):
        from services.firestore.sync_time_index import get_last_video_sync_time

        ts = MagicMock()
        expected_dt = datetime(2025, 6, 1, tzinfo=UTC)
        ts.to_datetime.return_value = expected_dt

        mock_db.collection.return_value.document.return_value.get.return_value = _make_index_doc(
            True,
            {"channels": [{"channel_id": "UC001", "lastVideoSyncAt": ts}]},
        )
        result = get_last_video_sync_time(mock_db, "UC001")
        assert result == expected_dt

    def test_google_api_error_returns_none(self, mock_db):
        from services.firestore.sync_time_index import get_last_video_sync_time

        mock_db.collection.return_value.document.return_value.get.side_effect = GoogleAPIError(
            "fail"
        )
        result = get_last_video_sync_time(mock_db, "UC001")
        assert result is None


class TestUpdateLastSyncTime:
    def test_empty_videos_returns_none(self, mock_db):
        from services.firestore.sync_time_index import update_last_sync_time

        result = update_last_sync_time(mock_db, "UC001", [])
        assert result is None

    def test_creates_new_index_when_doc_not_exists(self, mock_db):
        from services.firestore.sync_time_index import update_last_sync_time

        doc = _make_index_doc(False)
        mock_db.collection.return_value.document.return_value.get.return_value = doc
        mock_tx = MagicMock()
        mock_db.transaction.return_value = mock_tx

        videos = [
            {"snippet": {"publishedAt": "2025-06-01T12:00:00Z"}},
            {"snippet": {"publishedAt": "2025-06-02T12:00:00Z"}},
        ]
        result = update_last_sync_time(mock_db, "UC001", videos)
        assert result == "2025-06-02T12:00:00Z"

    def test_updates_existing_channel(self, mock_db):
        from services.firestore.sync_time_index import update_last_sync_time

        doc = _make_index_doc(
            True,
            {"channels": [{"channel_id": "UC001", "lastVideoSyncAt": "2025-05-01T00:00:00Z"}]},
        )
        mock_db.collection.return_value.document.return_value.get.return_value = doc
        mock_tx = MagicMock()
        mock_db.transaction.return_value = mock_tx

        videos = [{"snippet": {"publishedAt": "2025-06-15T10:00:00Z"}}]
        result = update_last_sync_time(mock_db, "UC001", videos)
        assert result == "2025-06-15T10:00:00Z"

    def test_appends_new_channel(self, mock_db):
        from services.firestore.sync_time_index import update_last_sync_time

        doc = _make_index_doc(
            True,
            {"channels": [{"channel_id": "UC999", "lastVideoSyncAt": "2025-01-01"}]},
        )
        mock_db.collection.return_value.document.return_value.get.return_value = doc
        mock_tx = MagicMock()
        mock_db.transaction.return_value = mock_tx

        videos = [{"snippet": {"publishedAt": "2025-06-10T00:00:00Z"}}]
        result = update_last_sync_time(mock_db, "UC001", videos)
        assert result == "2025-06-10T00:00:00Z"

    def test_google_api_error_returns_none(self, mock_db):
        from services.firestore.sync_time_index import update_last_sync_time

        mock_db.collection.return_value.document.return_value.get.side_effect = GoogleAPIError(
            "fail"
        )
        mock_db.transaction.return_value = MagicMock()

        videos = [{"snippet": {"publishedAt": "2025-06-01T00:00:00Z"}}]
        result = update_last_sync_time(mock_db, "UC001", videos)
        assert result is None
