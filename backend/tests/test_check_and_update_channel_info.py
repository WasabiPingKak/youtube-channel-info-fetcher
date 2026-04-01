"""
check_and_update_channel_info 測試：頻道名稱/頭像同步至三個 Firestore 路徑
"""

from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import GoogleAPIError
from googleapiclient.errors import HttpError


@pytest.fixture
def mock_db():
    return MagicMock()


def _setup_firestore_docs(mock_db, index_data, batch_data, info_data):
    """設定三個 Firestore 路徑回傳的文件資料"""
    index_doc = MagicMock()
    index_doc.to_dict.return_value = index_data

    batch_doc = MagicMock()
    batch_doc.to_dict.return_value = batch_data

    info_doc = MagicMock()
    info_doc.to_dict.return_value = info_data

    # 讓 transaction 內的 .get() 依序回傳三個文件
    # 使用 side_effect 需要對應 doc_ref.get(transaction=...) 的呼叫
    call_count = {"n": 0}
    docs = [index_doc, batch_doc, info_doc]

    def mock_get(**kwargs):
        idx = call_count["n"]
        call_count["n"] += 1
        return docs[idx]

    # 三個 doc_ref 各自有自己的 .get()
    refs = []
    for doc in docs:
        ref = MagicMock()
        ref.get.return_value = doc
        refs.append(ref)

    # channel_index → document(channel_id) → refs[0]
    # channel_index_batch → document(batch_id) → refs[1]
    # channel_data → document(cid) → collection(channel_info) → document(info) → refs[2]
    def collection_side_effect(name):
        coll = MagicMock()
        if name == "channel_index":
            coll.document.return_value = refs[0]
        elif name == "channel_index_batch":
            coll.document.return_value = refs[1]
        elif name == "channel_data":
            data_doc = MagicMock()
            inner_coll = MagicMock()
            inner_coll.document.return_value = refs[2]
            data_doc.collection.return_value = inner_coll
            coll.document.return_value = data_doc
        return coll

    mock_db.collection.side_effect = collection_side_effect

    # mock transaction — 直接執行 transactional callback
    mock_tx = MagicMock()
    mock_db.transaction.return_value = mock_tx

    return refs, mock_tx


class TestCheckAndUpdateChannelInfo:
    @patch("services.firestore.check_and_update_channel_info.fetch_channel_basic_info")
    def test_name_changed_updates_all_three_refs(self, mock_fetch, mock_db):
        mock_fetch.return_value = {
            "channel_id": "UC001",
            "name": "New Name",
            "thumbnail": "https://thumb.jpg",
        }

        refs, mock_tx = _setup_firestore_docs(
            mock_db,
            index_data={"name": "Old Name", "thumbnail": "https://thumb.jpg"},
            batch_data={
                "channels": [
                    {"channel_id": "UC001", "name": "Old Name", "thumbnail": "https://thumb.jpg"}
                ]
            },
            info_data={"name": "Old Name", "thumbnail": "https://thumb.jpg"},
        )

        from services.firestore.check_and_update_channel_info import (
            check_and_update_channel_info,
        )

        check_and_update_channel_info(mock_db, "UC001", "batch_0")

        # transaction 內應呼叫 set/update
        assert mock_tx.set.call_count >= 2  # index_ref + info_ref
        assert mock_tx.update.call_count >= 1  # batch_ref

    @patch("services.firestore.check_and_update_channel_info.fetch_channel_basic_info")
    def test_no_change_skips_update(self, mock_fetch, mock_db):
        mock_fetch.return_value = {
            "channel_id": "UC001",
            "name": "Same",
            "thumbnail": "https://same.jpg",
        }

        refs, mock_tx = _setup_firestore_docs(
            mock_db,
            index_data={"name": "Same", "thumbnail": "https://same.jpg"},
            batch_data={
                "channels": [
                    {"channel_id": "UC001", "name": "Same", "thumbnail": "https://same.jpg"}
                ]
            },
            info_data={"name": "Same", "thumbnail": "https://same.jpg"},
        )

        from services.firestore.check_and_update_channel_info import (
            check_and_update_channel_info,
        )

        check_and_update_channel_info(mock_db, "UC001", "batch_0")

        # 無變更不應呼叫 set/update
        mock_tx.set.assert_not_called()
        mock_tx.update.assert_not_called()

    @patch("services.firestore.check_and_update_channel_info.fetch_channel_basic_info")
    def test_batch_entry_not_found_still_updates_others(self, mock_fetch, mock_db):
        mock_fetch.return_value = {
            "channel_id": "UC001",
            "name": "New Name",
            "thumbnail": "https://new.jpg",
        }

        refs, mock_tx = _setup_firestore_docs(
            mock_db,
            index_data={"name": "Old Name", "thumbnail": "https://old.jpg"},
            batch_data={"channels": [{"channel_id": "UC999", "name": "Other"}]},
            info_data={"name": "Old Name", "thumbnail": "https://old.jpg"},
        )

        from services.firestore.check_and_update_channel_info import (
            check_and_update_channel_info,
        )

        check_and_update_channel_info(mock_db, "UC001", "batch_0")

        # index_ref 和 info_ref 仍應更新
        assert mock_tx.set.call_count >= 2
        # batch_ref 不應更新（batch_entry is None）
        mock_tx.update.assert_not_called()

    @patch("services.firestore.check_and_update_channel_info.fetch_channel_basic_info")
    def test_http_error_caught(self, mock_fetch, mock_db):
        mock_fetch.side_effect = HttpError(resp=MagicMock(status=403), content=b"forbidden")

        from services.firestore.check_and_update_channel_info import (
            check_and_update_channel_info,
        )

        # 不應拋出例外
        check_and_update_channel_info(mock_db, "UC001", "batch_0")

    @patch("services.firestore.check_and_update_channel_info.fetch_channel_basic_info")
    def test_google_api_error_caught(self, mock_fetch, mock_db):
        mock_fetch.side_effect = GoogleAPIError("firestore down")

        from services.firestore.check_and_update_channel_info import (
            check_and_update_channel_info,
        )

        # 不應拋出例外
        check_and_update_channel_info(mock_db, "UC001", "batch_0")
