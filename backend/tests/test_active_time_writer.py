"""
active_time_writer 測試：transaction 更新 active_time_all、batch 掃描邏輯
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import GoogleAPIError

from services.firestore.active_time_writer import (
    _update_active_time_in_transaction,
    write_active_time_all_to_channel_index_batch,
)


def _make_batch_doc(doc_id, channels):
    """建構 mock batch document"""
    doc = MagicMock()
    doc.id = doc_id
    doc.exists = True
    doc.to_dict.return_value = {"channels": channels}
    return doc


@pytest.fixture
def mock_db():
    return MagicMock()


# ═══════════════════════════════════════════════════════
# _update_active_time_in_transaction（用 .to_wrap() 繞過 @firestore.transactional）
# ═══════════════════════════════════════════════════════


class TestUpdateActiveTimeInTransaction:
    """測試 transaction callback 的讀取 + 更新邏輯"""

    def test_doc_not_exists_returns_false(self):
        tx = MagicMock()
        doc_ref = MagicMock()
        doc_mock = MagicMock()
        doc_mock.exists = False
        doc_ref.get.return_value = doc_mock

        result = _update_active_time_in_transaction.to_wrap(tx, doc_ref, "UC001", {"凌": 1})
        assert result is False

    def test_channel_found_updates_active_time(self):
        """找到對應 channel → 設定 active_time_all 並呼叫 transaction.set"""
        tx = MagicMock()
        doc_ref = MagicMock()
        channels = [
            {"channel_id": "UC001", "name": "test"},
            {"channel_id": "UC002", "name": "other"},
        ]
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = {"channels": channels}
        doc_ref.get.return_value = doc_mock

        new_stat = {"凌": 10, "早": 20, "午": 30, "晚": 40, "totalCount": 100}
        result = _update_active_time_in_transaction.to_wrap(tx, doc_ref, "UC001", new_stat)

        assert result is True
        assert channels[0]["active_time_all"] == new_stat
        tx.set.assert_called_once_with(doc_ref, {"channels": channels}, merge=True)

    def test_channel_not_found_returns_false(self):
        tx = MagicMock()
        doc_ref = MagicMock()
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = {"channels": [{"channel_id": "UC999"}]}
        doc_ref.get.return_value = doc_mock

        result = _update_active_time_in_transaction.to_wrap(tx, doc_ref, "UC001", {"凌": 1})
        assert result is False
        tx.set.assert_not_called()

    def test_empty_channels_list_returns_false(self):
        tx = MagicMock()
        doc_ref = MagicMock()
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = {"channels": []}
        doc_ref.get.return_value = doc_mock

        result = _update_active_time_in_transaction.to_wrap(tx, doc_ref, "UC001", {"凌": 1})
        assert result is False


# ═══════════════════════════════════════════════════════
# write_active_time_all_to_channel_index_batch
# ═══════════════════════════════════════════════════════


class TestWriteActiveTimeAllToChannelIndexBatch:
    """測試完整的 batch 掃描 + transaction 寫入流程"""

    def test_finds_channel_and_writes(self, mock_db):
        """在 batch 中找到 channel → 呼叫 transaction 更新"""
        batch_docs = [_make_batch_doc("batch_0", [{"channel_id": "UC001"}])]
        mock_db.collection.return_value.stream.return_value = batch_docs

        with patch(
            "services.firestore.active_time_writer._update_active_time_in_transaction"
        ) as mock_update:
            mock_update.return_value = True
            write_active_time_all_to_channel_index_batch(
                mock_db, "UC001", [10, 20, 30, 40], 100, datetime.now(UTC)
            )

        assert mock_update.call_count == 1

    def test_channel_not_found_in_any_batch(self, mock_db):
        """所有 batch 都找不到 → 不拋錯（只記 warning）"""
        batch_docs = [_make_batch_doc("batch_0", [{"channel_id": "UC999"}])]
        mock_db.collection.return_value.stream.return_value = batch_docs

        with patch(
            "services.firestore.active_time_writer._update_active_time_in_transaction",
            return_value=False,
        ):
            # 不應拋出例外
            write_active_time_all_to_channel_index_batch(
                mock_db, "UC001", [1, 2, 3, 4], 10, datetime.now(UTC)
            )

    def test_skips_non_batch_docs(self, mock_db):
        """只處理 batch_ 開頭的 document"""
        other_doc = MagicMock()
        other_doc.id = "metadata"
        batch_doc = _make_batch_doc("batch_0", [{"channel_id": "UC001"}])
        mock_db.collection.return_value.stream.return_value = [other_doc, batch_doc]

        with patch(
            "services.firestore.active_time_writer._update_active_time_in_transaction",
            return_value=True,
        ) as mock_update:
            write_active_time_all_to_channel_index_batch(
                mock_db, "UC001", [1, 2, 3, 4], 10, datetime.now(UTC)
            )

        # metadata 被過濾，只處理 batch_0
        assert mock_update.call_count == 1

    def test_google_api_error_caught(self, mock_db):
        """Firestore 錯誤被捕獲，不外洩"""
        mock_db.collection.return_value.stream.side_effect = GoogleAPIError("fail")
        # 不應拋出例外
        write_active_time_all_to_channel_index_batch(
            mock_db, "UC001", [1, 2, 3, 4], 10, datetime.now(UTC)
        )

    def test_stops_after_first_match(self, mock_db):
        """第一個 batch 找到 channel 後不再搜尋後續 batch"""
        batch_docs = [
            _make_batch_doc("batch_0", [{"channel_id": "UC001"}]),
            _make_batch_doc("batch_1", [{"channel_id": "UC001"}]),
        ]
        mock_db.collection.return_value.stream.return_value = batch_docs

        with patch(
            "services.firestore.active_time_writer._update_active_time_in_transaction"
        ) as mock_update:
            mock_update.side_effect = [True]  # 第一次就成功
            write_active_time_all_to_channel_index_batch(
                mock_db, "UC001", [1, 2, 3, 4], 10, datetime.now(UTC)
            )

        # 只呼叫一次（第二個 batch 不查）
        assert mock_update.call_count == 1

    def test_stat_structure(self, mock_db):
        """驗證組合出的 new_stat 結構包含 凌/早/午/晚/totalCount/updatedAt"""
        batch_docs = [_make_batch_doc("batch_0", [{"channel_id": "UC001"}])]
        mock_db.collection.return_value.stream.return_value = batch_docs

        now = datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC)
        captured_stat = {}

        with patch(
            "services.firestore.active_time_writer._update_active_time_in_transaction"
        ) as mock_update:

            def capture_stat(transaction, doc_ref, channel_id, new_stat):
                captured_stat.update(new_stat)
                return True

            mock_update.side_effect = capture_stat
            write_active_time_all_to_channel_index_batch(mock_db, "UC001", [5, 10, 15, 20], 50, now)

        assert captured_stat["凌"] == 5
        assert captured_stat["早"] == 10
        assert captured_stat["午"] == 15
        assert captured_stat["晚"] == 20
        assert captured_stat["totalCount"] == 50
        assert captured_stat["updatedAt"] == now
