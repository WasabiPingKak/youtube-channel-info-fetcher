"""
channel_loader 測試：load_all_channels_from_index_list / load_videos_for_channel

使用 Firestore emulator，搭配 circuit breaker 狀態驗證。
GoogleAPIError 場景改用 mock_db 避免 emulator 干擾。
"""

from unittest.mock import MagicMock

from google.api_core.exceptions import ServiceUnavailable

from services.firestore.channel_loader import (
    load_all_channels_from_index_list,
    load_videos_for_channel,
)
from utils.breaker_instances import firestore_breaker

# ═══════════════════════════════════════════════════════
# load_all_channels_from_index_list
# ═══════════════════════════════════════════════════════


class TestLoadAllChannelsFromIndexList:
    """從 channel_sync_index/index_list 載入頻道清單"""

    def test_returns_channels(self, db):
        """正常情況回傳完整頻道清單"""
        db.collection("channel_sync_index").document("index_list").set(
            {
                "channels": [
                    {"channel_id": "UC_CH_001", "name": "頻道一"},
                    {"channel_id": "UC_CH_002", "name": "頻道二"},
                ]
            }
        )

        result = load_all_channels_from_index_list(db)
        assert len(result) == 2
        assert result[0]["channel_id"] == "UC_CH_001"
        assert result[1]["channel_id"] == "UC_CH_002"

    def test_document_not_exists_returns_empty(self, db):
        """index_list 文件不存在 → 空 list"""
        result = load_all_channels_from_index_list(db)
        assert result == []

    def test_empty_channels_returns_empty(self, db):
        """channels 欄位為空陣列 → 空 list"""
        db.collection("channel_sync_index").document("index_list").set({"channels": []})

        result = load_all_channels_from_index_list(db)
        assert result == []

    def test_missing_channels_field_returns_empty(self, db):
        """文件存在但沒有 channels 欄位 → 空 list"""
        db.collection("channel_sync_index").document("index_list").set({"other_field": 123})

        result = load_all_channels_from_index_list(db)
        assert result == []

    def test_records_success_on_breaker(self, db):
        """成功載入後 circuit breaker 應記錄 success"""
        db.collection("channel_sync_index").document("index_list").set(
            {"channels": [{"channel_id": "UC_CH_001"}]}
        )

        load_all_channels_from_index_list(db)
        assert firestore_breaker.allow_request() is True

    def test_breaker_open_returns_empty(self, db):
        """circuit breaker 熔斷時直接回傳空 list，不存取 Firestore"""
        db.collection("channel_sync_index").document("index_list").set(
            {"channels": [{"channel_id": "UC_CH_001"}]}
        )

        for _ in range(firestore_breaker.failure_threshold):
            firestore_breaker.record_failure()

        result = load_all_channels_from_index_list(db)
        assert result == []

    def test_google_api_error_returns_empty(self):
        """Firestore 拋出 GoogleAPIError → 回傳空 list"""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.get.side_effect = ServiceUnavailable("emulated failure")
        mock_db.collection.return_value.document.return_value = mock_doc

        result = load_all_channels_from_index_list(mock_db)
        assert result == []


# ═══════════════════════════════════════════════════════
# load_videos_for_channel
# ═══════════════════════════════════════════════════════


class TestLoadVideosForChannel:
    """從 channel_data/{channel_id}/videos_batch 載入影片"""

    CHANNEL_ID = "UC_VIDEO_TEST"

    def _seed_batches(self, db, channel_id, batches: dict[int, list[dict]]):
        """寫入 batch 文件，batches = {batch_num: [video_dict, ...]}"""
        for batch_num, videos in batches.items():
            db.collection(f"channel_data/{channel_id}/videos_batch").document(
                f"batch_{batch_num}"
            ).set({"videos": videos})

    def test_returns_videos_sorted_by_batch(self, db):
        """多個 batch 應按 batch 編號排序合併"""
        self._seed_batches(
            db,
            self.CHANNEL_ID,
            {
                2: [{"id": "v3"}, {"id": "v4"}],
                0: [{"id": "v1"}],
                1: [{"id": "v2"}],
            },
        )

        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert [v["id"] for v in result] == ["v1", "v2", "v3", "v4"]

    def test_no_batches_returns_empty(self, db):
        """完全沒有 batch 文件 → 空 list"""
        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert result == []

    def test_ignores_non_batch_documents(self, db):
        """非 batch_N 命名的文件應被忽略"""
        db.collection(f"channel_data/{self.CHANNEL_ID}/videos_batch").document("metadata").set(
            {"info": "something"}
        )
        self._seed_batches(db, self.CHANNEL_ID, {0: [{"id": "v1"}]})

        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert len(result) == 1
        assert result[0]["id"] == "v1"

    def test_empty_videos_in_batch(self, db):
        """batch 文件存在但 videos 為空陣列"""
        self._seed_batches(db, self.CHANNEL_ID, {0: []})

        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert result == []

    def test_batch_missing_videos_field(self, db):
        """batch 文件缺少 videos 欄位 → 視為空"""
        db.collection(f"channel_data/{self.CHANNEL_ID}/videos_batch").document("batch_0").set(
            {"other": "data"}
        )

        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert result == []

    def test_single_batch(self, db):
        """只有一個 batch 的簡單情境"""
        self._seed_batches(
            db,
            self.CHANNEL_ID,
            {0: [{"id": "v1"}, {"id": "v2"}, {"id": "v3"}]},
        )

        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert len(result) == 3

    def test_records_success_on_breaker(self, db):
        """成功載入後 circuit breaker 記錄 success"""
        self._seed_batches(db, self.CHANNEL_ID, {0: [{"id": "v1"}]})

        load_videos_for_channel(db, self.CHANNEL_ID)
        assert firestore_breaker.allow_request() is True

    def test_breaker_open_returns_empty(self, db):
        """circuit breaker 熔斷時直接回傳空 list"""
        self._seed_batches(db, self.CHANNEL_ID, {0: [{"id": "v1"}]})

        for _ in range(firestore_breaker.failure_threshold):
            firestore_breaker.record_failure()

        result = load_videos_for_channel(db, self.CHANNEL_ID)
        assert result == []

    def test_google_api_error_returns_empty(self):
        """Firestore stream 拋出 GoogleAPIError → 回傳空 list"""
        mock_db = MagicMock()
        mock_db.collection.return_value.stream.side_effect = ServiceUnavailable("emulated failure")

        result = load_videos_for_channel(mock_db, "UC_FAIL")
        assert result == []
