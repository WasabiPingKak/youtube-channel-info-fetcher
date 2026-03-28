"""
classified_video_fetcher 測試：get_merged_settings、get_classified_videos、classify_live_title
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from services.classified_video_fetcher import (
    classify_live_title,
    get_classified_videos,
    get_merged_settings,
)


def _mock_db_with_settings(settings_dict):
    """建立回傳指定 settings 的 mock db"""
    db = MagicMock()
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = settings_dict
    db.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = doc
    return db


def _mock_db_no_settings():
    db = MagicMock()
    doc = MagicMock()
    doc.exists = False
    db.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = doc
    return db


# ═══════════════════════════════════════════════════════
# get_merged_settings
# ═══════════════════════════════════════════════════════


class TestGetMergedSettings:
    @patch("services.classified_video_fetcher.merge_game_categories_with_aliases")
    @patch("services.classified_video_fetcher.merge_main_categories_with_user_config")
    def test_returns_merged_settings(self, mock_main_merge, mock_game_merge):
        db = _mock_db_with_settings({"live": {"雜談": {}}})
        mock_main_merge.return_value = {"live": {"雜談": {"閒聊": []}}}
        mock_game_merge.return_value = {"live": {"雜談": {"閒聊": []}, "遊戲": {}}}

        result = get_merged_settings(db, "UCxxxxxxxxxxxxxxxxxxxxxx")

        assert "live" in result
        mock_main_merge.assert_called_once()
        mock_game_merge.assert_called_once()

    @patch("services.classified_video_fetcher.merge_game_categories_with_aliases")
    @patch("services.classified_video_fetcher.merge_main_categories_with_user_config")
    def test_no_settings_returns_empty(self, mock_main_merge, mock_game_merge):
        db = _mock_db_no_settings()

        result = get_merged_settings(db, "UCxxxxxxxxxxxxxxxxxxxxxx")

        assert result == {}
        mock_main_merge.assert_not_called()
        mock_game_merge.assert_not_called()


# ═══════════════════════════════════════════════════════
# get_classified_videos
# ═══════════════════════════════════════════════════════

SAMPLE_SETTINGS = {
    "live": {
        "雜談": {"閒聊": ["聊天"]},
        "遊戲": {"Minecraft": ["mc"]},
        "其他": {},
    },
    "videos": {
        "雜談": {"閒聊": ["聊天"]},
        "遊戲": {},
        "其他": {},
    },
}


def _make_video(video_id, title, publish_date, video_type="直播檔", duration=3600):
    """建立清洗後格式的影片資料"""
    return {
        "videoId": video_id,
        "title": title,
        "publishDate": publish_date,
        "duration": duration,
        "type": video_type,
    }


def _setup_db_with_videos(videos, settings=None):
    """建立有 settings 和 videos 的 mock db"""
    if settings is None:
        settings = SAMPLE_SETTINGS

    db = MagicMock()

    # settings doc
    settings_doc = MagicMock()
    settings_doc.exists = True
    settings_doc.to_dict.return_value = settings

    # videos batch docs
    batch_doc = MagicMock()
    batch_doc.to_dict.return_value = {"videos": videos}

    def route_collection(col_name):
        mock_col = MagicMock()
        if col_name == "channel_data":
            doc_mock = MagicMock()

            def route_sub_collection(sub_name):
                sub_mock = MagicMock()
                if sub_name == "settings":
                    config_doc = MagicMock()
                    config_doc.get.return_value = settings_doc
                    sub_mock.document.return_value = config_doc
                elif sub_name == "videos_batch":
                    sub_mock.stream.return_value = [batch_doc]
                return sub_mock

            doc_mock.collection.side_effect = route_sub_collection
            mock_col.document.return_value = doc_mock
        return mock_col

    db.collection.side_effect = route_collection
    return db


class TestGetClassifiedVideos:
    @patch("services.classified_video_fetcher.get_merged_settings")
    @patch("services.classified_video_fetcher.normalize_video_item")
    @patch("services.classified_video_fetcher.match_category_and_game")
    def test_basic_classification(self, mock_match, mock_normalize, mock_settings):
        """基本分類流程"""
        mock_settings.return_value = SAMPLE_SETTINGS
        mock_normalize.return_value = {
            "videoId": "v1",
            "title": "閒聊配信",
            "publishDate": "2024-01-15T12:00:00+00:00",
            "duration": 3600,
            "type": "直播檔",
        }
        mock_match.return_value = {
            "matchedCategories": ["雜談"],
            "game": None,
            "matchedKeywords": ["閒聊"],
            "matchedPairs": [{"main": "雜談", "keyword": "閒聊", "hitKeywords": ["閒聊"]}],
        }

        db = MagicMock()
        db.collection.return_value.document.return_value.collection.return_value.stream.return_value = [
            MagicMock(to_dict=lambda: {"videos": [{"videoId": "v1"}]})
        ]

        result = get_classified_videos(db, "UCxxxxxxxxxxxxxxxxxxxxxx")

        assert len(result) == 1
        assert result[0]["videoId"] == "v1"
        assert "雜談" in result[0]["matchedCategories"]

    @patch("services.classified_video_fetcher.get_merged_settings")
    def test_no_settings_returns_empty(self, mock_settings):
        mock_settings.return_value = {}
        db = MagicMock()

        result = get_classified_videos(db, "UCxxxxxxxxxxxxxxxxxxxxxx")
        assert result == []

    @patch("services.classified_video_fetcher.get_merged_settings")
    @patch("services.classified_video_fetcher.normalize_video_item")
    def test_normalize_returns_none_skipped(self, mock_normalize, mock_settings):
        """normalize_video_item 回傳 None → 跳過"""
        mock_settings.return_value = SAMPLE_SETTINGS
        mock_normalize.return_value = None

        db = MagicMock()
        db.collection.return_value.document.return_value.collection.return_value.stream.return_value = [
            MagicMock(to_dict=lambda: {"videos": [{"bad": "data"}]})
        ]

        result = get_classified_videos(db, "UCxxxxxxxxxxxxxxxxxxxxxx")
        assert result == []

    @patch("services.classified_video_fetcher.get_merged_settings")
    @patch("services.classified_video_fetcher.normalize_video_item")
    @patch("services.classified_video_fetcher.match_category_and_game")
    def test_time_filter_start(self, mock_match, mock_normalize, mock_settings):
        """start 過濾：早於 start 的影片被排除"""
        mock_settings.return_value = SAMPLE_SETTINGS
        mock_match.return_value = {
            "matchedCategories": ["其他"],
            "game": None,
            "matchedKeywords": [],
            "matchedPairs": [],
        }

        # 兩部影片，一部早於 start
        call_count = [0]

        def normalize_side_effect(raw):
            call_count[0] += 1
            if call_count[0] == 1:
                return {
                    "videoId": "old",
                    "title": "舊影片",
                    "publishDate": "2024-01-01T00:00:00+00:00",
                    "duration": 100,
                    "type": "直播檔",
                }
            return {
                "videoId": "new",
                "title": "新影片",
                "publishDate": "2024-06-01T00:00:00+00:00",
                "duration": 100,
                "type": "直播檔",
            }

        mock_normalize.side_effect = normalize_side_effect

        db = MagicMock()
        db.collection.return_value.document.return_value.collection.return_value.stream.return_value = [
            MagicMock(to_dict=lambda: {"videos": [{"v": 1}, {"v": 2}]})
        ]

        start = datetime(2024, 3, 1, tzinfo=UTC)
        result = get_classified_videos(db, "UCxxxxxxxxxxxxxxxxxxxxxx", start=start)

        assert len(result) == 1
        assert result[0]["videoId"] == "new"

    @patch("services.classified_video_fetcher.get_merged_settings")
    @patch("services.classified_video_fetcher.normalize_video_item")
    def test_invalid_publish_date_skipped(self, mock_normalize, mock_settings):
        """publishDate 格式錯誤 → 跳過"""
        mock_settings.return_value = SAMPLE_SETTINGS
        mock_normalize.return_value = {
            "videoId": "v1",
            "title": "test",
            "publishDate": "not-a-date",
            "duration": 100,
            "type": "直播檔",
        }

        db = MagicMock()
        db.collection.return_value.document.return_value.collection.return_value.stream.return_value = [
            MagicMock(to_dict=lambda: {"videos": [{"v": 1}]})
        ]

        result = get_classified_videos(db, "UCxxxxxxxxxxxxxxxxxxxxxx")
        assert result == []

    @patch("services.classified_video_fetcher.get_merged_settings")
    def test_exception_returns_empty(self, mock_settings):
        """異常時回傳空 list"""
        mock_settings.side_effect = Exception("Firestore error")
        db = MagicMock()

        result = get_classified_videos(db, "UCxxxxxxxxxxxxxxxxxxxxxx")
        assert result == []


# ═══════════════════════════════════════════════════════
# classify_live_title
# ═══════════════════════════════════════════════════════


class TestClassifyLiveTitle:
    @patch("services.classified_video_fetcher.match_category_and_game")
    @patch("services.classified_video_fetcher.get_merged_settings")
    def test_returns_categories_and_pairs(self, mock_settings, mock_match):
        mock_settings.return_value = SAMPLE_SETTINGS
        mock_match.return_value = {
            "matchedCategories": ["雜談"],
            "game": None,
            "matchedKeywords": ["閒聊"],
            "matchedPairs": [{"main": "雜談", "keyword": "閒聊", "hitKeywords": ["閒聊"]}],
        }

        db = MagicMock()
        result = classify_live_title(db, "UCxxxxxxxxxxxxxxxxxxxxxx", "閒聊配信")

        assert "matchedCategories" in result
        assert "matchedPairs" in result
        assert "雜談" in result["matchedCategories"]

    @patch("services.classified_video_fetcher.get_merged_settings")
    def test_no_settings_returns_empty(self, mock_settings):
        mock_settings.return_value = {}
        db = MagicMock()

        result = classify_live_title(db, "UCxxxxxxxxxxxxxxxxxxxxxx", "test")
        assert result["matchedCategories"] == []
        assert result["matchedPairs"] == []

    @patch("services.classified_video_fetcher.get_merged_settings")
    def test_exception_returns_empty(self, mock_settings):
        mock_settings.side_effect = Exception("error")
        db = MagicMock()

        result = classify_live_title(db, "UCxxxxxxxxxxxxxxxxxxxxxx", "test")
        assert result["matchedCategories"] == []
        assert result["matchedPairs"] == []
