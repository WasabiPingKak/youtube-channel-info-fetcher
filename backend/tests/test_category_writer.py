"""
category_writer 測試：category_counts 寫入 channel_index_batch
"""

from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import GoogleAPIError


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_batch_doc(doc_id, channels):
    doc = MagicMock()
    doc.id = doc_id
    doc.exists = True
    doc.to_dict.return_value = {"channels": channels}
    return doc


class TestUpdateCategoryCountsInTransaction:
    """_update_category_counts_in_transaction 的 transaction callback 邏輯"""

    def test_doc_not_exists_returns_false(self):
        from services.firestore.category_writer import (
            _update_category_counts_in_transaction,
        )

        tx = MagicMock()
        doc_ref = MagicMock()
        doc_mock = MagicMock()
        doc_mock.exists = False
        doc_ref.get.return_value = doc_mock

        result = _update_category_counts_in_transaction.to_wrap(tx, doc_ref, "UC001", {"遊戲": 5})
        assert result is False

    def test_channel_found_updates_counts(self):
        from services.firestore.category_writer import (
            _update_category_counts_in_transaction,
        )

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

        counts = {"遊戲": 5, "雜談": 3}
        result = _update_category_counts_in_transaction.to_wrap(tx, doc_ref, "UC001", counts)

        assert result is True
        assert channels[0]["category_counts"] == counts
        tx.set.assert_called_once_with(doc_ref, {"channels": channels}, merge=True)

    def test_channel_not_found_returns_false(self):
        from services.firestore.category_writer import (
            _update_category_counts_in_transaction,
        )

        tx = MagicMock()
        doc_ref = MagicMock()
        doc_mock = MagicMock()
        doc_mock.exists = True
        doc_mock.to_dict.return_value = {"channels": [{"channel_id": "UC999"}]}
        doc_ref.get.return_value = doc_mock

        result = _update_category_counts_in_transaction.to_wrap(tx, doc_ref, "UC001", {"遊戲": 1})
        assert result is False
        tx.set.assert_not_called()


class TestWriteCategoryCountsToChannelIndexBatch:
    """write_category_counts_to_channel_index_batch 整合流程"""

    def test_finds_channel_in_second_batch(self, mock_db):
        """頻道在第二個 batch 中找到時正確更新"""
        from services.firestore.category_writer import (
            write_category_counts_to_channel_index_batch,
        )

        batch_docs = [
            _make_batch_doc("batch_0", [{"channel_id": "UC999"}]),
            _make_batch_doc("batch_1", [{"channel_id": "UC001"}]),
        ]
        mock_db.collection.return_value.stream.return_value = batch_docs

        # mock transaction 讓第一次回 False，第二次回 True
        with patch(
            "services.firestore.category_writer._update_category_counts_in_transaction"
        ) as mock_update:
            mock_update.side_effect = [False, True]
            write_category_counts_to_channel_index_batch(mock_db, "UC001", {"遊戲": 5})

        assert mock_update.call_count == 2

    def test_channel_not_found_in_any_batch(self, mock_db):
        """所有 batch 都找不到頻道時記錄 warning"""
        from services.firestore.category_writer import (
            write_category_counts_to_channel_index_batch,
        )

        batch_docs = [_make_batch_doc("batch_0", [{"channel_id": "UC999"}])]
        mock_db.collection.return_value.stream.return_value = batch_docs

        with patch(
            "services.firestore.category_writer._update_category_counts_in_transaction",
            return_value=False,
        ):
            # 不應拋出例外
            write_category_counts_to_channel_index_batch(mock_db, "UC001", {"遊戲": 1})

    def test_google_api_error_caught(self, mock_db):
        """Firestore 錯誤被捕獲不外洩"""
        from services.firestore.category_writer import (
            write_category_counts_to_channel_index_batch,
        )

        mock_db.collection.return_value.stream.side_effect = GoogleAPIError("fail")
        # 不應拋出例外
        write_category_counts_to_channel_index_batch(mock_db, "UC001", {"遊戲": 1})

    def test_skips_non_batch_docs(self, mock_db):
        """只處理以 batch_ 開頭的文件"""
        from services.firestore.category_writer import (
            write_category_counts_to_channel_index_batch,
        )

        other_doc = MagicMock()
        other_doc.id = "metadata"
        batch_doc = _make_batch_doc("batch_0", [{"channel_id": "UC001"}])
        mock_db.collection.return_value.stream.return_value = [other_doc, batch_doc]

        with patch(
            "services.firestore.category_writer._update_category_counts_in_transaction",
            return_value=True,
        ) as mock_update:
            write_category_counts_to_channel_index_batch(mock_db, "UC001", {"遊戲": 5})

        # metadata 文件應被過濾，只處理 batch_0
        assert mock_update.call_count == 1
