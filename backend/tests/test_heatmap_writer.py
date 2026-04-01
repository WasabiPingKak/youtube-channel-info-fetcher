"""
heatmap_writer 測試：初始化檢查、矩陣轉換、Firestore 寫入
"""

from unittest.mock import MagicMock

import pytest
from google.api_core.exceptions import GoogleAPIError

from services.firestore.heatmap_writer import (
    convert_to_nested_map,
    is_channel_heatmap_initialized,
    write_channel_heatmap_result,
)


@pytest.fixture
def mock_db():
    return MagicMock()


# ═══════════════════════════════════════════════════════
# is_channel_heatmap_initialized
# ═══════════════════════════════════════════════════════


class TestIsChannelHeatmapInitialized:
    """檢查 heatmap document 是否含有 all_range 欄位"""

    def test_initialized_returns_true(self, mock_db):
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = {"all_range": {"matrix": {}}}
        mock_db.document.return_value.get.return_value = doc_mock

        assert is_channel_heatmap_initialized(mock_db, "UC001") is True

    def test_not_initialized_returns_false(self, mock_db):
        """document 存在但沒有 all_range → False"""
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = {"other_field": 123}
        mock_db.document.return_value.get.return_value = doc_mock

        assert is_channel_heatmap_initialized(mock_db, "UC001") is False

    def test_doc_not_exists_returns_false(self, mock_db):
        doc_mock = MagicMock()
        doc_mock.exists = False
        mock_db.document.return_value.get.return_value = doc_mock

        assert is_channel_heatmap_initialized(mock_db, "UC001") is False

    def test_google_api_error_returns_false(self, mock_db):
        mock_db.document.return_value.get.side_effect = GoogleAPIError("fail")

        assert is_channel_heatmap_initialized(mock_db, "UC001") is False

    def test_doc_to_dict_returns_none(self, mock_db):
        """to_dict() 回傳 None（邊界情況）→ False"""
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = None
        mock_db.document.return_value.get.return_value = doc_mock

        assert is_channel_heatmap_initialized(mock_db, "UC001") is False


# ═══════════════════════════════════════════════════════
# convert_to_nested_map
# ═══════════════════════════════════════════════════════


class TestConvertToNestedMap:
    """將 array-of-arrays → nested map（Firestore 不接受 array of array）"""

    def test_basic_conversion(self):
        matrix = {"Mon": [["v1"], ["v2", "v3"]]}
        result = convert_to_nested_map(matrix)

        assert result["Mon"]["0"] == ["v1"]
        assert result["Mon"]["1"] == ["v2", "v3"]

    def test_empty_input(self):
        assert convert_to_nested_map({}) == {}

    def test_hour_keys_are_strings(self):
        """inner key 必須是字串 "0", "1", ... 不是整數"""
        matrix = {"Tue": [[] for _ in range(24)]}
        result = convert_to_nested_map(matrix)

        for key in result["Tue"]:
            assert isinstance(key, str)

    def test_all_seven_days(self):
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        matrix = {day: [[] for _ in range(24)] for day in days}
        result = convert_to_nested_map(matrix)

        assert set(result.keys()) == set(days)
        for day in days:
            assert len(result[day]) == 24

    def test_preserves_video_ids(self):
        """轉換後影片 ID 內容不變"""
        matrix = {"Wed": [["vid_a", "vid_b"]] + [[] for _ in range(23)]}
        result = convert_to_nested_map(matrix)
        assert result["Wed"]["0"] == ["vid_a", "vid_b"]


# ═══════════════════════════════════════════════════════
# write_channel_heatmap_result
# ═══════════════════════════════════════════════════════


class TestWriteChannelHeatmapResult:
    """測試 heatmap 寫入 Firestore 的完整流程"""

    def test_writes_correct_structure(self, mock_db):
        """提供 matrix + count → doc_ref.set 被呼叫且結構正確"""
        matrix = {"Mon": [[] for _ in range(24)]}
        write_channel_heatmap_result(mock_db, "UC001", full_matrix=matrix, full_count=42)

        mock_db.document.return_value.set.assert_called_once()
        written = mock_db.document.return_value.set.call_args[0][0]
        assert "all_range" in written
        assert written["all_range"]["totalCount"] == 42
        assert "matrix" in written["all_range"]
        assert "updatedAt" in written["all_range"]

    def test_no_data_skips_write(self, mock_db):
        """matrix 和 count 都是 None → 不呼叫 set"""
        write_channel_heatmap_result(mock_db, "UC001", full_matrix=None, full_count=None)
        mock_db.document.return_value.set.assert_not_called()

    def test_matrix_only_without_count_skips(self, mock_db):
        """只有 matrix 沒有 count → 條件不成立，不寫入"""
        matrix = {"Mon": [[] for _ in range(24)]}
        write_channel_heatmap_result(mock_db, "UC001", full_matrix=matrix, full_count=None)
        mock_db.document.return_value.set.assert_not_called()

    def test_google_api_error_caught(self, mock_db):
        """Firestore 寫入失敗 → 例外被捕獲"""
        mock_db.document.return_value.set.side_effect = GoogleAPIError("fail")
        matrix = {"Mon": [[] for _ in range(24)]}
        # 不應拋出例外
        write_channel_heatmap_result(mock_db, "UC001", full_matrix=matrix, full_count=1)

    def test_correct_firestore_path(self, mock_db):
        """驗證 Firestore document path 正確"""
        matrix = {"Mon": [[] for _ in range(24)]}
        write_channel_heatmap_result(mock_db, "UC_TEST", full_matrix=matrix, full_count=1)

        mock_db.document.assert_called_with("channel_data/UC_TEST/heat_map/channel_video_heatmap")
