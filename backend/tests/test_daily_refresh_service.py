"""
daily_refresh_service 測試：頻道排程更新邏輯
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

from services.channel_updater.daily_refresh_service import (
    get_batch_id_map,
    select_channels_for_scan,
    update_index_entry,
)


class TestSelectChannelsForScan:
    def test_selects_oldest_first(self):
        now = datetime.now(UTC)
        channels = [
            {"channel_id": "UC001", "lastCheckedAt": (now - timedelta(days=5)).isoformat()},
            {"channel_id": "UC002", "lastCheckedAt": (now - timedelta(days=10)).isoformat()},
        ]
        result = select_channels_for_scan(channels, limit=10)
        assert result[0]["channel_id"] == "UC002"

    def test_never_checked_has_highest_priority(self):
        now = datetime.now(UTC)
        channels = [
            {"channel_id": "UC001", "lastCheckedAt": (now - timedelta(days=10)).isoformat()},
            {"channel_id": "UC002"},  # 無 lastCheckedAt
        ]
        result = select_channels_for_scan(channels, limit=10)
        assert result[0]["channel_id"] == "UC002"

    def test_skips_recent_by_default(self):
        now = datetime.now(UTC)
        channels = [
            {"channel_id": "UC001", "lastCheckedAt": (now - timedelta(hours=1)).isoformat()},
        ]
        result = select_channels_for_scan(channels, limit=10)
        assert len(result) == 0

    def test_include_recent_flag(self):
        now = datetime.now(UTC)
        channels = [
            {"channel_id": "UC001", "lastCheckedAt": (now - timedelta(hours=1)).isoformat()},
        ]
        result = select_channels_for_scan(channels, limit=10, include_recent=True)
        assert len(result) == 1

    def test_respects_limit(self):
        channels = [{"channel_id": f"UC{i:03d}"} for i in range(10)]
        result = select_channels_for_scan(channels, limit=3)
        assert len(result) == 3

    def test_skips_entries_without_channel_id(self):
        channels = [{"name": "no id"}]
        result = select_channels_for_scan(channels, limit=10)
        assert len(result) == 0

    def test_handles_invalid_datetime_format(self):
        channels = [{"channel_id": "UC001", "lastCheckedAt": "not-a-date"}]
        result = select_channels_for_scan(channels, limit=10)
        assert len(result) == 0


class TestUpdateIndexEntry:
    def test_updates_existing_entry(self):
        now = datetime.now(UTC)
        index_data = {"channels": [{"channel_id": "UC001", "lastCheckedAt": "old"}]}
        update_index_entry(index_data, "UC001", checked_at=now, sync_at="2026-03-01")
        assert index_data["channels"][0]["lastCheckedAt"] == now.isoformat()
        assert index_data["channels"][0]["lastVideoSyncAt"] == "2026-03-01"

    def test_appends_new_entry(self):
        now = datetime.now(UTC)
        index_data = {"channels": []}
        update_index_entry(index_data, "UC_NEW", checked_at=now, sync_at=None)
        assert len(index_data["channels"]) == 1
        assert index_data["channels"][0]["channel_id"] == "UC_NEW"

    def test_no_sync_at(self):
        now = datetime.now(UTC)
        index_data = {"channels": [{"channel_id": "UC001", "lastCheckedAt": "old"}]}
        update_index_entry(index_data, "UC001", checked_at=now, sync_at=None)
        assert "lastVideoSyncAt" not in index_data["channels"][0]


class TestGetBatchIdMap:
    def test_builds_map(self):
        db = MagicMock()
        doc1 = MagicMock()
        doc1.id = "batch_0"
        doc1.to_dict.return_value = {
            "channels": [
                {"channel_id": "UC001"},
                {"channel_id": "UC002"},
            ]
        }
        doc2 = MagicMock()
        doc2.id = "batch_1"
        doc2.to_dict.return_value = {"channels": [{"channel_id": "UC003"}]}
        db.collection("channel_index_batch").stream.return_value = [doc1, doc2]

        result = get_batch_id_map(db)
        assert result == {"UC001": "batch_0", "UC002": "batch_0", "UC003": "batch_1"}

    def test_skips_entries_without_channel_id(self):
        db = MagicMock()
        doc = MagicMock()
        doc.id = "batch_0"
        doc.to_dict.return_value = {"channels": [{"name": "no_id"}]}
        db.collection("channel_index_batch").stream.return_value = [doc]

        result = get_batch_id_map(db)
        assert len(result) == 0
