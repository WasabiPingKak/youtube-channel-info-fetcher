"""services/channel_index_service.py 的單元測試"""

from datetime import datetime
from unittest.mock import MagicMock

from services.channel_index_service import get_all_enabled_channels_data, try_parse_date


class TestTryParseDate:
    def test_datetime_object(self):
        dt = datetime(2025, 6, 1, 12, 0, 0)
        assert try_parse_date(dt) == dt.date()

    def test_iso_string(self):
        result = try_parse_date("2025-06-01T12:00:00+00:00")
        assert result == datetime(2025, 6, 1).date()

    def test_invalid_string(self):
        assert try_parse_date("not-a-date") is None

    def test_none(self):
        assert try_parse_date(None) is None

    def test_integer(self):
        assert try_parse_date(12345) is None


class TestGetAllEnabledChannelsData:
    def setup_method(self):
        self.db = MagicMock()

    def _make_sync_doc(self, channels):
        doc = MagicMock()
        doc.exists = True
        doc.to_dict.return_value = {"channels": channels}
        return doc

    def _make_batch_doc(self, channels):
        doc = MagicMock()
        doc.to_dict.return_value = {"channels": channels}
        return doc

    def test_empty_batch_returns_empty(self):
        """無 batch 資料時回傳空清單"""
        sync_doc = MagicMock()
        sync_doc.exists = False

        self.db.collection.return_value.document.return_value.get.return_value = sync_doc
        self.db.collection.return_value.stream.return_value = []

        result = get_all_enabled_channels_data(self.db)

        assert result["channels"] == []
        assert result["newly_joined_channels"] == []
        assert result["total_registered_count"] == 0

    def test_disabled_channels_filtered_out(self):
        """disabled 的頻道不出現在 channels 清單"""
        sync_doc = MagicMock()
        sync_doc.exists = False
        self.db.collection.return_value.document.return_value.get.return_value = sync_doc

        batch = self._make_batch_doc(
            [
                {"channel_id": "UC_a", "name": "A", "enabled": True, "priority": 0},
                {"channel_id": "UC_b", "name": "B", "enabled": False, "priority": 0},
            ]
        )
        self.db.collection.return_value.stream.return_value = [batch]

        result = get_all_enabled_channels_data(self.db)

        assert len(result["channels"]) == 1
        assert result["channels"][0]["channel_id"] == "UC_a"
        assert result["total_registered_count"] == 2

    def test_channels_sorted_by_priority_desc_then_name(self):
        """頻道按 priority 降序、name 升序排列"""
        sync_doc = MagicMock()
        sync_doc.exists = False
        self.db.collection.return_value.document.return_value.get.return_value = sync_doc

        batch = self._make_batch_doc(
            [
                {"channel_id": "UC_a", "name": "ZZZ", "enabled": True, "priority": 0},
                {"channel_id": "UC_b", "name": "AAA", "enabled": True, "priority": 10},
                {"channel_id": "UC_c", "name": "MMM", "enabled": True, "priority": 10},
            ]
        )
        self.db.collection.return_value.stream.return_value = [batch]

        result = get_all_enabled_channels_data(self.db)

        names = [ch["name"] for ch in result["channels"]]
        assert names == ["AAA", "MMM", "ZZZ"]

    def test_sync_map_populates_last_video_uploaded_at(self):
        """sync index 的 lastVideoSyncAt 正確對應到頻道"""
        sync_doc = self._make_sync_doc(
            [{"channel_id": "UC_a", "lastVideoSyncAt": "2025-06-01T00:00:00Z"}]
        )
        self.db.collection.return_value.document.return_value.get.return_value = sync_doc

        batch = self._make_batch_doc(
            [{"channel_id": "UC_a", "name": "A", "enabled": True, "priority": 0}]
        )
        self.db.collection.return_value.stream.return_value = [batch]

        result = get_all_enabled_channels_data(self.db)

        assert result["channels"][0]["lastVideoUploadedAt"] == "2025-06-01T00:00:00Z"
