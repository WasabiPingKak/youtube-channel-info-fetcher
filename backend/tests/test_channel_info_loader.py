"""
channel_info_loader 測試：從 channel_index_batch 載入頻道資訊
"""

from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_batch_doc(channels):
    doc = MagicMock()
    doc.to_dict.return_value = {"channels": channels}
    return doc


class TestLoadChannelInfoIndex:
    def test_loads_enabled_channels(self, mock_db):
        from services.trending.channel_info_loader import load_channel_info_index

        mock_db.collection.return_value.stream.return_value = [
            _make_batch_doc(
                [
                    {
                        "channel_id": "UC001",
                        "name": "Channel A",
                        "thumbnail": "a.jpg",
                        "enabled": True,
                    },
                    {
                        "channel_id": "UC002",
                        "name": "Channel B",
                        "thumbnail": "b.jpg",
                    },  # 預設 enabled
                ]
            )
        ]

        result = load_channel_info_index(mock_db)
        assert "UC001" in result
        assert "UC002" in result
        assert result["UC001"]["name"] == "Channel A"

    def test_excludes_disabled_channels(self, mock_db):
        from services.trending.channel_info_loader import load_channel_info_index

        mock_db.collection.return_value.stream.return_value = [
            _make_batch_doc(
                [
                    {"channel_id": "UC001", "name": "Active", "enabled": True},
                    {"channel_id": "UC002", "name": "Disabled", "enabled": False},
                ]
            )
        ]

        result = load_channel_info_index(mock_db)
        assert "UC001" in result
        assert "UC002" not in result

    def test_skips_entries_without_channel_id(self, mock_db):
        from services.trending.channel_info_loader import load_channel_info_index

        mock_db.collection.return_value.stream.return_value = [
            _make_batch_doc(
                [
                    {"name": "No ID"},  # 無 channel_id
                    {"channel_id": "UC001", "name": "Has ID"},
                ]
            )
        ]

        result = load_channel_info_index(mock_db)
        assert len(result) == 1
        assert "UC001" in result

    def test_multiple_batches_merged(self, mock_db):
        from services.trending.channel_info_loader import load_channel_info_index

        mock_db.collection.return_value.stream.return_value = [
            _make_batch_doc([{"channel_id": "UC001", "name": "A", "thumbnail": "a.jpg"}]),
            _make_batch_doc([{"channel_id": "UC002", "name": "B", "thumbnail": "b.jpg"}]),
        ]

        result = load_channel_info_index(mock_db)
        assert len(result) == 2

    def test_duplicate_channel_id_keeps_first(self, mock_db):
        from services.trending.channel_info_loader import load_channel_info_index

        mock_db.collection.return_value.stream.return_value = [
            _make_batch_doc([{"channel_id": "UC001", "name": "First", "thumbnail": "1.jpg"}]),
            _make_batch_doc([{"channel_id": "UC001", "name": "Second", "thumbnail": "2.jpg"}]),
        ]

        result = load_channel_info_index(mock_db)
        assert result["UC001"]["name"] == "First"

    def test_empty_batches(self, mock_db):
        from services.trending.channel_info_loader import load_channel_info_index

        mock_db.collection.return_value.stream.return_value = []

        result = load_channel_info_index(mock_db)
        assert result == {}
