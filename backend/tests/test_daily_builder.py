"""
daily_builder 測試：trending 每日批次建立邏輯
"""

from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import GoogleAPIError


@pytest.fixture
def mock_db():
    return MagicMock()


# 共用的 patch 路徑前綴
_MOD = "services.trending.daily_builder"


class TestBuildTrendingForDateRange:
    @patch(f"{_MOD}.write_document")
    @patch(f"{_MOD}.document_exists", return_value=False)
    @patch(f"{_MOD}.classify_videos_to_games")
    @patch(f"{_MOD}.match_category_and_game")
    @patch(f"{_MOD}.load_channel_settings_and_videos")
    @patch(f"{_MOD}.get_active_channels")
    def test_single_day_basic_flow(
        self,
        mock_active,
        mock_load,
        mock_match,
        mock_classify,
        mock_exists,
        mock_write,
        mock_db,
    ):
        from services.trending.daily_builder import build_trending_for_date_range

        mock_active.return_value = [{"channel_id": "UC001"}]
        mock_load.return_value = (
            {"UC001": {"keywords": []}},  # settings_map
            {"UC001": [{"title": "玩 Minecraft", "publishDate": "2025-06-15T10:00:00Z"}]},
        )
        mock_classify.return_value = (
            {"Minecraft": [{"title": "玩 Minecraft", "channel_id": "UC001"}]},
            {"videos_processed": 1, "videos_classified": 1, "games_found": {"Minecraft": 1}},
        )

        result = build_trending_for_date_range("2025-06-15", 1, mock_db)

        assert result["startDate"] == "2025-06-15"
        assert len(result["results"]) == 1
        assert result["results"][0]["skipped"] is False
        mock_write.assert_called_once()

    @patch(f"{_MOD}.write_document")
    @patch(f"{_MOD}.document_exists", return_value=True)
    @patch(f"{_MOD}.load_channel_settings_and_videos")
    @patch(f"{_MOD}.get_active_channels")
    def test_skips_existing_document(
        self,
        mock_active,
        mock_load,
        mock_exists,
        mock_write,
        mock_db,
    ):
        from services.trending.daily_builder import build_trending_for_date_range

        mock_active.return_value = []
        mock_load.return_value = ({}, {})

        result = build_trending_for_date_range("2025-06-15", 1, mock_db, force=False)

        assert result["results"][0]["skipped"] is True
        mock_write.assert_not_called()

    @patch(f"{_MOD}.write_document")
    @patch(f"{_MOD}.document_exists", return_value=True)
    @patch(f"{_MOD}.classify_videos_to_games")
    @patch(f"{_MOD}.match_category_and_game")
    @patch(f"{_MOD}.load_channel_settings_and_videos")
    @patch(f"{_MOD}.get_active_channels")
    def test_force_overrides_existing(
        self,
        mock_active,
        mock_load,
        mock_match,
        mock_classify,
        mock_exists,
        mock_write,
        mock_db,
    ):
        from services.trending.daily_builder import build_trending_for_date_range

        mock_active.return_value = [{"channel_id": "UC001"}]
        mock_load.return_value = ({"UC001": {}}, {"UC001": []})
        mock_classify.return_value = (
            {},
            {"videos_processed": 0, "videos_classified": 0, "games_found": {}},
        )

        result = build_trending_for_date_range("2025-06-15", 1, mock_db, force=True)

        assert result["results"][0]["skipped"] is False
        mock_write.assert_called_once()

    @patch(f"{_MOD}.write_document")
    @patch(f"{_MOD}.document_exists", return_value=False)
    @patch(f"{_MOD}.classify_videos_to_games")
    @patch(f"{_MOD}.match_category_and_game")
    @patch(f"{_MOD}.load_channel_settings_and_videos")
    @patch(f"{_MOD}.get_active_channels")
    def test_multi_day_range(
        self,
        mock_active,
        mock_load,
        mock_match,
        mock_classify,
        mock_exists,
        mock_write,
        mock_db,
    ):
        from services.trending.daily_builder import build_trending_for_date_range

        mock_active.return_value = [{"channel_id": "UC001"}]
        mock_load.return_value = ({"UC001": {}}, {"UC001": []})
        mock_classify.return_value = (
            {},
            {"videos_processed": 0, "videos_classified": 0, "games_found": {}},
        )

        result = build_trending_for_date_range("2025-06-15", 3, mock_db)

        assert len(result["results"]) == 3
        assert result["days"] == 3
        assert mock_write.call_count == 3

    @patch(f"{_MOD}.write_document")
    @patch(f"{_MOD}.document_exists", return_value=False)
    @patch(f"{_MOD}.classify_videos_to_games")
    @patch(f"{_MOD}.match_category_and_game")
    @patch(f"{_MOD}.load_channel_settings_and_videos")
    @patch(f"{_MOD}.get_active_channels")
    def test_merges_game_maps_across_channels(
        self,
        mock_active,
        mock_load,
        mock_match,
        mock_classify,
        mock_exists,
        mock_write,
        mock_db,
    ):
        from services.trending.daily_builder import build_trending_for_date_range

        mock_active.return_value = [
            {"channel_id": "UC001"},
            {"channel_id": "UC002"},
        ]
        mock_load.return_value = (
            {"UC001": {}, "UC002": {}},
            {
                "UC001": [{"title": "Minecraft", "publishDate": "2025-06-15T10:00:00Z"}],
                "UC002": [{"title": "Minecraft too", "publishDate": "2025-06-15T11:00:00Z"}],
            },
        )

        # 兩個頻道都有 Minecraft 影片
        mock_classify.side_effect = [
            (
                {"Minecraft": [{"title": "Minecraft", "channel_id": "UC001"}]},
                {"videos_processed": 1, "videos_classified": 1, "games_found": {"Minecraft": 1}},
            ),
            (
                {"Minecraft": [{"title": "Minecraft too", "channel_id": "UC002"}]},
                {"videos_processed": 1, "videos_classified": 1, "games_found": {"Minecraft": 1}},
            ),
        ]

        build_trending_for_date_range("2025-06-15", 1, mock_db)

        # write_document 的 data 參數應包含合併後的 Minecraft 列表
        written_data = mock_write.call_args[0][2]
        assert len(written_data["Minecraft"]) == 2

    @patch(f"{_MOD}.get_active_channels")
    def test_google_api_error_returns_error(self, mock_active, mock_db):
        from services.trending.daily_builder import build_trending_for_date_range

        mock_active.side_effect = GoogleAPIError("boom")

        result = build_trending_for_date_range("2025-06-15", 1, mock_db)
        assert "error" in result
