"""
notify_queue_reader 測試：從 live_redirect_notifications 讀取待處理影片
包含向後相容讀取舊 live_redirect_notify_queue 的測試
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=UTC)
TODAY = "2025-06-15"
YESTERDAY = "2025-06-14"


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_doc(data: dict):
    """模擬 Firestore document snapshot"""
    doc = MagicMock()
    doc.to_dict.return_value = data
    return doc


def _setup_collections(mock_db, new_docs=None, old_docs=None):
    """設定新舊 collection 的 mock

    Args:
        new_docs: {date_str: [item_dict, ...]} 新 collection 的資料
        old_docs: {date_str: {"videos": [...]}} 舊 collection 的資料
    """
    new_docs = new_docs or {}
    old_docs = old_docs or {}

    def collection_side_effect(name):
        coll = MagicMock()
        if name == "live_redirect_notifications":

            def where_side_effect(field, op, value):
                query = MagicMock()
                query.stream.return_value = [_make_doc(d) for d in new_docs.get(value, [])]
                return query

            coll.where = where_side_effect
        elif name == "live_redirect_notify_queue":

            def document_side_effect(doc_id):
                doc_ref = MagicMock()
                doc_ref.get.return_value = _make_doc(old_docs.get(doc_id) or {})
                return doc_ref

            coll.document = document_side_effect
        return coll

    mock_db.collection = collection_side_effect


class TestGetPendingVideoIds:
    def test_returns_unprocessed_videos(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            new_docs={
                TODAY: [
                    {"videoId": "v1", "notifiedAt": "2025-06-15T10:00:00Z", "date": TODAY},
                    {
                        "videoId": "v2",
                        "notifiedAt": "2025-06-15T11:00:00Z",
                        "date": TODAY,
                        "processedAt": "done",
                    },
                ],
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        video_ids = [v["videoId"] for v in result]
        assert "v1" in video_ids
        assert "v2" not in video_ids

    def test_force_includes_processed(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            new_docs={
                TODAY: [
                    {
                        "videoId": "v1",
                        "notifiedAt": "2025-06-15T10:00:00Z",
                        "date": TODAY,
                        "processedAt": "2025-06-15T10:00:00Z",
                    },
                ],
            },
        )

        result = get_pending_video_ids(mock_db, force=True, now=NOW)
        assert len(result) == 1

    def test_deduplicates_by_video_id_keeps_newer(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            new_docs={
                YESTERDAY: [
                    {"videoId": "v1", "notifiedAt": "2025-06-14T08:00:00Z", "date": YESTERDAY},
                ],
                TODAY: [
                    {"videoId": "v1", "notifiedAt": "2025-06-15T10:00:00Z", "date": TODAY},
                ],
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert len(result) == 1
        assert result[0]["notifiedAt"] == "2025-06-15T10:00:00Z"

    def test_skips_entries_without_video_id(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            new_docs={
                TODAY: [
                    {"notifiedAt": "2025-06-15T10:00:00Z", "date": TODAY},
                    {"videoId": "v1", "notifiedAt": "2025-06-15T10:00:00Z", "date": TODAY},
                ],
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert len(result) == 1

    def test_empty_queue(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(mock_db)

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert result == []


class TestBackwardCompatibility:
    """測試向後相容：從舊 collection 讀取未處理的通知"""

    def test_reads_from_old_collection(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            old_docs={
                TODAY: {
                    "videos": [
                        {"videoId": "old_v1", "notifiedAt": "2025-06-15T09:00:00Z"},
                    ]
                },
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert len(result) == 1
        assert result[0]["videoId"] == "old_v1"

    def test_new_collection_takes_priority(self, mock_db):
        """新舊 collection 都有相同 videoId 時，以新 collection 為準"""
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            new_docs={
                TODAY: [
                    {"videoId": "v1", "notifiedAt": "2025-06-15T11:00:00Z", "date": TODAY},
                ],
            },
            old_docs={
                TODAY: {
                    "videos": [
                        {"videoId": "v1", "notifiedAt": "2025-06-15T09:00:00Z"},
                    ]
                },
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert len(result) == 1
        assert result[0]["notifiedAt"] == "2025-06-15T11:00:00Z"

    def test_merges_old_and_new(self, mock_db):
        """新舊 collection 各有不同的 videoId，應合併"""
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            new_docs={
                TODAY: [
                    {"videoId": "new_v1", "notifiedAt": "2025-06-15T11:00:00Z", "date": TODAY},
                ],
            },
            old_docs={
                TODAY: {
                    "videos": [
                        {"videoId": "old_v1", "notifiedAt": "2025-06-15T09:00:00Z"},
                    ]
                },
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        video_ids = {v["videoId"] for v in result}
        assert video_ids == {"new_v1", "old_v1"}

    def test_skips_processed_in_old_collection(self, mock_db):
        from services.live_redirect.notify_queue_reader import get_pending_video_ids

        _setup_collections(
            mock_db,
            old_docs={
                TODAY: {
                    "videos": [
                        {
                            "videoId": "old_v1",
                            "notifiedAt": "2025-06-15T09:00:00Z",
                            "processedAt": "done",
                        },
                    ]
                },
            },
        )

        result = get_pending_video_ids(mock_db, force=False, now=NOW)
        assert result == []
