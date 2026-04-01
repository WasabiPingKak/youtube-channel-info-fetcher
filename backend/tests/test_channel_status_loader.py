"""
channel_status_loader 測試：活躍頻道篩選邏輯
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from google.api_core.exceptions import GoogleAPIError


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_index_doc(exists, channels=None):
    doc = MagicMock()
    doc.exists = exists
    doc.to_dict.return_value = {"channels": channels or []}
    return doc


def _make_batch_doc(channels):
    doc = MagicMock()
    doc.to_dict.return_value = {"channels": channels}
    return doc


class TestGetActiveChannels:
    def test_no_index_returns_empty(self, mock_db):
        from services.trending.channel_status_loader import get_active_channels

        mock_db.collection.return_value.document.return_value.get.return_value = _make_index_doc(
            False
        )
        # stream() for batch docs
        mock_db.collection.return_value.stream.return_value = []

        result = get_active_channels(mock_db)
        assert result == []

    def test_recently_synced_channel_is_active(self, mock_db):
        from services.trending.channel_status_loader import get_active_channels

        now = datetime.now(UTC)
        recent = (now - timedelta(days=5)).isoformat()

        index_doc = _make_index_doc(
            True,
            [{"channel_id": "UC001", "lastVideoSyncAt": recent}],
        )

        def collection_side_effect(name):
            coll = MagicMock()
            if name == "channel_sync_index":
                coll.document.return_value.get.return_value = index_doc
            elif name == "channel_index_batch":
                coll.stream.return_value = [_make_batch_doc([])]
            return coll

        mock_db.collection.side_effect = collection_side_effect

        result = get_active_channels(mock_db)
        assert len(result) == 1
        assert result[0]["channel_id"] == "UC001"

    def test_recently_checked_channel_is_active(self, mock_db):
        from services.trending.channel_status_loader import get_active_channels

        now = datetime.now(UTC)
        recent_check = (now - timedelta(days=3)).isoformat()
        old_sync = (now - timedelta(days=60)).isoformat()

        index_doc = _make_index_doc(
            True,
            [
                {
                    "channel_id": "UC001",
                    "lastVideoSyncAt": old_sync,
                    "lastCheckedAt": recent_check,
                }
            ],
        )

        def collection_side_effect(name):
            coll = MagicMock()
            if name == "channel_sync_index":
                coll.document.return_value.get.return_value = index_doc
            elif name == "channel_index_batch":
                coll.stream.return_value = [_make_batch_doc([])]
            return coll

        mock_db.collection.side_effect = collection_side_effect

        result = get_active_channels(mock_db)
        assert len(result) == 1

    def test_old_channel_excluded(self, mock_db):
        from services.trending.channel_status_loader import get_active_channels

        now = datetime.now(UTC)
        old = (now - timedelta(days=60)).isoformat()

        index_doc = _make_index_doc(
            True,
            [{"channel_id": "UC001", "lastVideoSyncAt": old}],
        )

        def collection_side_effect(name):
            coll = MagicMock()
            if name == "channel_sync_index":
                coll.document.return_value.get.return_value = index_doc
            elif name == "channel_index_batch":
                coll.stream.return_value = [_make_batch_doc([])]
            return coll

        mock_db.collection.side_effect = collection_side_effect

        result = get_active_channels(mock_db)
        assert result == []

    def test_disabled_channel_excluded(self, mock_db):
        from services.trending.channel_status_loader import get_active_channels

        now = datetime.now(UTC)
        recent = (now - timedelta(days=5)).isoformat()

        index_doc = _make_index_doc(
            True,
            [{"channel_id": "UC001", "lastVideoSyncAt": recent}],
        )

        def collection_side_effect(name):
            coll = MagicMock()
            if name == "channel_sync_index":
                coll.document.return_value.get.return_value = index_doc
            elif name == "channel_index_batch":
                coll.stream.return_value = [
                    _make_batch_doc([{"channel_id": "UC001", "enabled": False}])
                ]
            return coll

        mock_db.collection.side_effect = collection_side_effect

        result = get_active_channels(mock_db)
        assert result == []

    def test_google_api_error_returns_empty(self, mock_db):
        from services.trending.channel_status_loader import get_active_channels

        mock_db.collection.side_effect = GoogleAPIError("fail")

        result = get_active_channels(mock_db)
        assert result == []
