"""
heatmap_analyzer 測試：空矩陣建立、單頻道分析、全頻道批次分析
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from services.heatmap_analyzer import (
    WEEKDAY_KEYS,
    analyze_and_update_all_channels,
    create_empty_video_matrix,
    update_single_channel_heatmap,
)


@pytest.fixture
def mock_db():
    return MagicMock()


# ═══════════════════════════════════════════════════════
# create_empty_video_matrix
# ═══════════════════════════════════════════════════════


class TestCreateEmptyVideoMatrix:
    """7x24 空矩陣的結構驗證"""

    def test_has_seven_days(self):
        matrix = create_empty_video_matrix()
        assert set(matrix.keys()) == set(WEEKDAY_KEYS)

    def test_each_day_has_24_slots(self):
        matrix = create_empty_video_matrix()
        for day in WEEKDAY_KEYS:
            assert len(matrix[day]) == 24

    def test_each_hour_is_empty_list(self):
        matrix = create_empty_video_matrix()
        for day in WEEKDAY_KEYS:
            for hour_list in matrix[day]:
                assert hour_list == []

    def test_lists_are_independent(self):
        """修改一個 slot 不會影響其他 slot（無共享參照）"""
        matrix = create_empty_video_matrix()
        matrix["Mon"][0].append("vid1")
        assert matrix["Mon"][1] == []
        assert matrix["Tue"][0] == []


# ═══════════════════════════════════════════════════════
# update_single_channel_heatmap
# ═══════════════════════════════════════════════════════


class TestUpdateSingleChannelHeatmap:
    """單一頻道的影片活躍時間分析"""

    @patch("services.heatmap_analyzer.write_active_time_all_to_channel_index_batch")
    @patch("services.heatmap_analyzer.write_channel_heatmap_result")
    @patch("services.heatmap_analyzer.load_videos_for_channel")
    def test_empty_channel_id_returns_false(self, mock_load, mock_write_hm, mock_write_at, mock_db):
        assert update_single_channel_heatmap(mock_db, "") is False
        assert update_single_channel_heatmap(mock_db, None) is False
        mock_load.assert_not_called()

    @patch("services.heatmap_analyzer.write_active_time_all_to_channel_index_batch")
    @patch("services.heatmap_analyzer.write_channel_heatmap_result")
    @patch("services.heatmap_analyzer.load_videos_for_channel", return_value=[])
    def test_no_videos_returns_false(self, mock_load, mock_write_hm, mock_write_at, mock_db):
        assert update_single_channel_heatmap(mock_db, "UC001") is False
        mock_write_hm.assert_not_called()
        mock_write_at.assert_not_called()

    @patch("services.heatmap_analyzer.write_active_time_all_to_channel_index_batch")
    @patch("services.heatmap_analyzer.write_channel_heatmap_result")
    @patch("services.heatmap_analyzer.load_videos_for_channel")
    def test_single_video_correct_slot(self, mock_load, mock_write_hm, mock_write_at, mock_db):
        """UTC 2025-06-02 16:00 = 台灣 2025-06-03 (Tue) 00:00 → slot=0(凌)"""
        mock_load.return_value = [{"videoId": "vid_a", "publishDate": "2025-06-02T16:00:00Z"}]

        result = update_single_channel_heatmap(mock_db, "UC001")
        assert result is True

        # 驗證 heatmap writer 收到的 matrix
        call_kwargs = mock_write_hm.call_args[1]
        matrix = call_kwargs["full_matrix"]
        assert "vid_a" in matrix["Tue"][0]  # 台灣時間 Tue 00:00
        assert call_kwargs["full_count"] == 1

        # 驗證 slot_counter: hour=0, slot=0//6=0 → 凌
        at_kwargs = mock_write_at.call_args[1]
        assert at_kwargs["slot_counter"][0] == 1  # 凌
        assert sum(at_kwargs["slot_counter"]) == 1

    @patch("services.heatmap_analyzer.write_active_time_all_to_channel_index_batch")
    @patch("services.heatmap_analyzer.write_channel_heatmap_result")
    @patch("services.heatmap_analyzer.load_videos_for_channel")
    def test_calls_both_writers(self, mock_load, mock_write_hm, mock_write_at, mock_db):
        """成功分析後應同時寫入 heatmap 和 active_time"""
        mock_load.return_value = [{"videoId": "v1", "publishDate": "2025-01-06T10:00:00+08:00"}]

        update_single_channel_heatmap(mock_db, "UC001")

        mock_write_hm.assert_called_once()
        mock_write_at.assert_called_once()

    @patch("services.heatmap_analyzer.write_active_time_all_to_channel_index_batch")
    @patch("services.heatmap_analyzer.write_channel_heatmap_result")
    @patch("services.heatmap_analyzer.load_videos_for_channel")
    def test_video_without_id_skipped(self, mock_load, mock_write_hm, mock_write_at, mock_db):
        """影片缺少 videoId → 跳過該影片，其他正常處理"""
        mock_load.return_value = [
            {"publishDate": "2025-01-06T10:00:00+08:00"},  # 無 videoId
            {"videoId": "v2", "publishDate": "2025-01-06T10:00:00+08:00"},
        ]

        result = update_single_channel_heatmap(mock_db, "UC001")
        assert result is True

        call_kwargs = mock_write_hm.call_args[1]
        assert call_kwargs["full_count"] == 2  # 全部影片數量（非處理數量）

    @patch("services.heatmap_analyzer.write_active_time_all_to_channel_index_batch")
    @patch("services.heatmap_analyzer.write_channel_heatmap_result")
    @patch("services.heatmap_analyzer.load_videos_for_channel")
    def test_returns_true_on_success(self, mock_load, mock_write_hm, mock_write_at, mock_db):
        mock_load.return_value = [{"videoId": "v1", "publishDate": "2025-01-06T10:00:00+08:00"}]
        assert update_single_channel_heatmap(mock_db, "UC001") is True


# ═══════════════════════════════════════════════════════
# analyze_and_update_all_channels
# ═══════════════════════════════════════════════════════


class TestAnalyzeAndUpdateAllChannels:
    """批次分析所有頻道的 heatmap"""

    @patch("services.heatmap_analyzer.update_single_channel_heatmap")
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list", return_value=[])
    def test_empty_channel_list(self, mock_load, mock_update, mock_db):
        result = analyze_and_update_all_channels(mock_db)
        assert result["updated"] == 0
        assert result["skipped"] == 0
        mock_update.assert_not_called()

    @patch("services.heatmap_analyzer.update_single_channel_heatmap")
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list")
    def test_skips_without_channel_id(self, mock_load, mock_update, mock_db):
        """缺少 channel_id 的 entry → skipped +1"""
        mock_load.return_value = [{"name": "no_id"}]
        result = analyze_and_update_all_channels(mock_db)
        assert result["skipped"] == 1
        mock_update.assert_not_called()

    @patch("services.heatmap_analyzer.update_single_channel_heatmap")
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list")
    def test_skips_without_last_sync(self, mock_load, mock_update, mock_db):
        """無 lastVideoSyncAt → skipped"""
        mock_load.return_value = [{"channel_id": "UC001"}]
        result = analyze_and_update_all_channels(mock_db)
        assert result["skipped"] == 1
        assert "UC001" in result["skipped_channels"]

    @patch("services.heatmap_analyzer.update_single_channel_heatmap")
    @patch("services.heatmap_analyzer.is_within_last_7_days", return_value=False)
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list")
    def test_skips_stale_channel(self, mock_load, mock_within, mock_update, mock_db):
        """lastVideoSyncAt 超過 7 天 → 跳過"""
        mock_load.return_value = [
            {"channel_id": "UC001", "lastVideoSyncAt": "2020-01-01T00:00:00+00:00"}
        ]
        result = analyze_and_update_all_channels(mock_db)
        assert result["skipped"] == 1
        mock_update.assert_not_called()

    @patch("services.heatmap_analyzer.update_single_channel_heatmap", return_value=True)
    @patch("services.heatmap_analyzer.is_within_last_7_days", return_value=True)
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list")
    def test_processes_recent_channel(self, mock_load, mock_within, mock_update, mock_db):
        """lastVideoSyncAt 在 7 天內 → 呼叫 update_single_channel_heatmap"""
        mock_load.return_value = [
            {
                "channel_id": "UC001",
                "lastVideoSyncAt": datetime.now(UTC).isoformat(),
            }
        ]
        result = analyze_and_update_all_channels(mock_db)
        assert result["updated"] == 1
        mock_update.assert_called_once_with(mock_db, "UC001")

    @patch("services.heatmap_analyzer.update_single_channel_heatmap")
    @patch("services.heatmap_analyzer.is_within_last_7_days", return_value=True)
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list")
    def test_exception_counted_as_skipped(self, mock_load, mock_within, mock_update, mock_db):
        """update_single_channel_heatmap 拋錯 → skipped，不中斷其他頻道"""
        mock_load.return_value = [
            {"channel_id": "UC001", "lastVideoSyncAt": datetime.now(UTC).isoformat()},
            {"channel_id": "UC002", "lastVideoSyncAt": datetime.now(UTC).isoformat()},
        ]
        mock_update.side_effect = [RuntimeError("boom"), True]

        result = analyze_and_update_all_channels(mock_db)
        assert result["updated"] == 1
        assert result["skipped"] == 1
        assert "UC001" in result["skipped_channels"]

    @patch("services.heatmap_analyzer.update_single_channel_heatmap")
    @patch("services.heatmap_analyzer.load_all_channels_from_index_list")
    def test_invalid_date_format_skipped(self, mock_load, mock_update, mock_db):
        """lastVideoSyncAt 格式錯誤 → skipped"""
        mock_load.return_value = [{"channel_id": "UC001", "lastVideoSyncAt": "not-a-date"}]
        result = analyze_and_update_all_channels(mock_db)
        assert result["skipped"] == 1
        mock_update.assert_not_called()
