"""
Trending service 測試：驗證主協調器的資料流與錯誤處理
"""

from unittest.mock import patch


class TestGetTrendingGamesSummary:
    """get_trending_games_summary 協調流程"""

    @patch("services.trending.trending_service.analyze_trending_summary")
    @patch("services.trending.trending_service.load_trending_videos_by_date_range")
    @patch("services.trending.trending_service.load_channel_info_index")
    def test_returns_analysis_result(self, mock_load_ch, mock_load_vid, mock_analyze, mock_db):
        from services.trending.trending_service import get_trending_games_summary

        mock_load_ch.return_value = {"UC001": {"name": "Ch1", "thumbnail": "t1"}}
        mock_load_vid.return_value = [{"game": "Minecraft", "channelId": "UC001"}]
        mock_analyze.return_value = {"gameList": ["Minecraft"], "dates": []}

        result = get_trending_games_summary(mock_db, days=7)

        assert result["gameList"] == ["Minecraft"]
        mock_load_vid.assert_called_once_with(mock_db, days=7)
        mock_analyze.assert_called_once()

    @patch("services.trending.trending_service.analyze_trending_summary")
    @patch("services.trending.trending_service.load_trending_videos_by_date_range")
    @patch("services.trending.trending_service.load_channel_info_index")
    def test_invalid_days_defaults_to_30(self, mock_load_ch, mock_load_vid, mock_analyze, mock_db):
        from services.trending.trending_service import get_trending_games_summary

        mock_load_ch.return_value = {}
        mock_load_vid.return_value = []
        mock_analyze.return_value = {}

        get_trending_games_summary(mock_db, days=999)
        mock_load_vid.assert_called_once_with(mock_db, days=30)

    @patch("services.trending.trending_service.load_channel_info_index")
    def test_google_api_error_returns_error_dict(self, mock_load_ch, mock_db):
        from google.api_core.exceptions import GoogleAPIError

        from services.trending.trending_service import get_trending_games_summary

        mock_load_ch.side_effect = GoogleAPIError("boom")
        result = get_trending_games_summary(mock_db, days=7)
        assert "error" in result
