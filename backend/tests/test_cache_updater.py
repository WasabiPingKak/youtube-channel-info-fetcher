"""services/live_redirect/cache_updater.py 的單元測試"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

from services.live_redirect.cache_updater import (
    _filter_video_ids_to_query,
    _lazy_refresh_endtime,
    process_video_ids,
)

UTC = UTC


class TestFilterVideoIdsToQuery:
    def setup_method(self):
        self.now = datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC)

    def test_new_video_not_in_cache(self):
        """全新影片（不在快取中）應加入查詢"""
        notify_ids = {"vid1": {"videoId": "vid1"}}
        result = _filter_video_ids_to_query(notify_ids, {}, set(), self.now)
        assert result == ["vid1"]

    def test_excludes_ended_videos(self):
        """已收播影片不查詢"""
        notify_ids = {"vid1": {"videoId": "vid1"}}
        end_recorded = {"vid1"}
        result = _filter_video_ids_to_query(notify_ids, {}, end_recorded, self.now)
        assert result == []

    def test_excludes_upcoming_beyond_15min(self):
        """預約時間超過 15 分鐘的影片不查詢"""
        notify_ids = {"vid1": {"videoId": "vid1"}}
        cached_map = {
            "vid1": {
                "live": {
                    "videoId": "vid1",
                    "isUpcoming": True,
                    "startTime": (self.now + timedelta(minutes=30)).isoformat(),
                }
            }
        }
        result = _filter_video_ids_to_query(notify_ids, cached_map, set(), self.now)
        assert result == []

    def test_includes_upcoming_within_15min(self):
        """預約時間在 15 分鐘內的影片要查詢"""
        notify_ids = {"vid1": {"videoId": "vid1"}}
        cached_map = {
            "vid1": {
                "live": {
                    "videoId": "vid1",
                    "isUpcoming": True,
                    "startTime": (self.now + timedelta(minutes=5)).isoformat(),
                }
            }
        }
        result = _filter_video_ids_to_query(notify_ids, cached_map, set(), self.now)
        assert result == ["vid1"]

    def test_includes_cached_not_upcoming(self):
        """快取中存在但不是 upcoming 的影片要查詢"""
        notify_ids = {"vid1": {"videoId": "vid1"}}
        cached_map = {"vid1": {"live": {"videoId": "vid1", "isUpcoming": False}}}
        result = _filter_video_ids_to_query(notify_ids, cached_map, set(), self.now)
        assert result == ["vid1"]


class TestProcessVideoIds:
    def setup_method(self):
        self.db = MagicMock()
        self.now = datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC)

    def _setup_empty_cache(self):
        """設定空快取"""
        empty_doc = MagicMock()
        empty_doc.to_dict.return_value = {}
        self.db.collection.return_value.document.return_value.get.return_value = empty_doc

    @patch("services.live_redirect.cache_updater._lazy_refresh_endtime")
    @patch("services.live_redirect.cache_updater._mark_processed_in_transaction")
    @patch("services.live_redirect.cache_updater.classify_live_title")
    @patch("services.live_redirect.cache_updater.classify_video")
    @patch("services.live_redirect.cache_updater.batch_fetch_video_details")
    def test_new_video_classified_and_cached(
        self, mock_fetch, mock_classify, mock_title, mock_mark, mock_lazy
    ):
        self._setup_empty_cache()
        mock_lazy.return_value = {"channels": []}

        mock_fetch.return_value = [{"id": "vid1"}]
        mock_classify.return_value = {
            "channelId": "UC_test",
            "live": {"videoId": "vid1", "title": "測試直播"},
        }
        mock_title.return_value = {"matchedCategories": ["雜談"], "matchedPairs": []}

        result = process_video_ids(self.db, [{"videoId": "vid1"}], self.now)

        assert len(result["channels"]) >= 1
        assert result["updatedAt"] == self.now.isoformat()
        mock_mark.assert_called()

    @patch("services.live_redirect.cache_updater._lazy_refresh_endtime")
    @patch("services.live_redirect.cache_updater._mark_processed_in_transaction")
    @patch("services.live_redirect.cache_updater.build_fallback_entry")
    @patch("services.live_redirect.cache_updater.batch_fetch_video_details")
    def test_fallback_when_youtube_returns_nothing(
        self, mock_fetch, mock_fallback, mock_mark, mock_lazy
    ):
        self._setup_empty_cache()
        mock_lazy.return_value = {"channels": []}

        mock_fetch.return_value = []
        mock_fallback.return_value = {
            "channelId": "unknown",
            "live": {"videoId": "vid1", "title": "未知"},
        }

        result = process_video_ids(self.db, [{"videoId": "vid1"}], self.now)

        mock_fallback.assert_called_once()
        assert len(result["channels"]) >= 1

    @patch("services.live_redirect.cache_updater._lazy_refresh_endtime")
    @patch("services.live_redirect.cache_updater._mark_processed_in_transaction")
    @patch("services.live_redirect.cache_updater.batch_fetch_video_details")
    def test_empty_notify_returns_cache(self, mock_fetch, mock_mark, mock_lazy):
        self._setup_empty_cache()
        mock_lazy.return_value = {"channels": []}
        mock_fetch.return_value = []

        result = process_video_ids(self.db, [], self.now)

        assert result["channels"] == []


class TestLazyRefreshEndtime:
    def setup_method(self):
        self.db = MagicMock()
        self.now = datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC)

    @patch("services.live_redirect.cache_updater.build_fallback_entry")
    @patch("services.live_redirect.cache_updater.classify_video")
    @patch("services.live_redirect.cache_updater.batch_fetch_video_details")
    def test_queries_videos_without_endtime(self, mock_fetch, mock_classify, _mock_fb):
        """懶更新只查詢 endTime 為 null 的影片"""
        old_channels = [
            {"live": {"videoId": "vid1"}},  # 無 endTime
            {"live": {"videoId": "vid2", "endTime": "2025-06-01T10:00:00+00:00"}},  # 有 endTime
        ]
        cached_map = {c["live"]["videoId"]: c for c in old_channels}
        end_recorded = {"vid2"}

        mock_fetch.return_value = [{"id": "vid1"}]
        mock_classify.return_value = {
            "channelId": "UC_test",
            "live": {"videoId": "vid1", "title": "test"},
        }

        result = _lazy_refresh_endtime(self.db, old_channels, cached_map, end_recorded, self.now)

        # 只有 vid1 被查詢
        mock_fetch.assert_called_once()
        assert len(result["channels"]) == 1
