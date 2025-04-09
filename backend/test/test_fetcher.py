import pytest
import datetime
from unittest.mock import patch, MagicMock
from services.youtube.fetcher import get_video_data

@patch("services.youtube.fetcher.get_youtube_service", return_value=None)
@patch("os.getenv", side_effect=lambda k: "fake" if k == "API_KEY" else "@testchannel")
def test_youtube_service_fail(mock_env, mock_get_service):
    result = get_video_data()
    assert result == []

@patch("services.youtube.fetcher.get_channel_id", return_value=None)
@patch("services.youtube.fetcher.get_youtube_service")
@patch("os.getenv", side_effect=lambda k: "fake" if k == "API_KEY" else "@testchannel")
def test_channel_id_not_found(mock_env, mock_service, mock_get_channel_id):
    mock_service.return_value = MagicMock()
    result = get_video_data()
    assert result == []

@patch("services.youtube.fetcher.get_uploads_playlist_id", return_value=None)
@patch("services.youtube.fetcher.get_channel_id", return_value="UCabc")
@patch("services.youtube.fetcher.get_youtube_service")
@patch("os.getenv", side_effect=lambda k: "fake" if k == "API_KEY" else "@testchannel")
def test_playlist_id_not_found(mock_env, mock_service, mock_get_channel_id, mock_get_playlist):
    mock_service.return_value = MagicMock()
    result = get_video_data()
    assert result == []

@patch("services.youtube.fetcher.get_video_ids_from_playlist", return_value=[])
@patch("services.youtube.fetcher.get_uploads_playlist_id", return_value="UUabc")
@patch("services.youtube.fetcher.get_channel_id", return_value="UCabc")
@patch("services.youtube.fetcher.get_youtube_service")
@patch("os.getenv", side_effect=lambda k: "fake" if k == "API_KEY" else "@testchannel")
def test_no_videos_found(mock_env, mock_service, *args):
    mock_service.return_value = MagicMock()
    result = get_video_data()
    assert result == []

@patch("os.getenv", side_effect=lambda k: "fake" if k == "API_KEY" else "@testchannel")
@patch("services.youtube.fetcher.get_youtube_service")
@patch("services.youtube.fetcher.get_channel_id", return_value="UCabc")
@patch("services.youtube.fetcher.get_uploads_playlist_id", return_value="UUabc")
@patch("services.youtube.fetcher.get_video_ids_from_playlist", return_value=["vid123"])
@patch("services.youtube.fetcher.fetch_video_details")
@patch("services.youtube.fetcher.get_video_type", return_value="節目")
@patch("services.youtube.fetcher.get_video_publish_date", return_value="2024-01-01")
@patch("services.youtube.fetcher.convert_duration_to_hms", return_value=("10:00", 10))
@patch("services.youtube.fetcher.fetch_video_details")
@patch("services.youtube.fetcher.get_video_ids_from_playlist", return_value=["vid_in_range"])
@patch("services.youtube.fetcher.get_uploads_playlist_id", return_value="UUabc")
@patch("services.youtube.fetcher.get_channel_id", return_value="UCabc")
@patch("services.youtube.fetcher.get_youtube_service")
@patch("os.getenv", side_effect=lambda k: "fake" if k == "API_KEY" else "@test")
def test_video_in_range_included(
    mock_env, mock_service, mock_channel, mock_playlist,
    mock_ids, mock_details, mock_duration, mock_date, mock_type
):
    mock_service.return_value = MagicMock()
    mock_details.return_value = [{
        "id": "vid_in_range",
        "snippet": {
            "title": "【科技】符合時間範圍",
            "publishedAt": "2024-06-01T10:00:00Z"
        },
        "contentDetails": {"duration": "PT10M"}
    }]
    date_range = [
        (datetime.datetime(2024, 1, 1), datetime.datetime(2024, 12, 31))
    ]
    result = get_video_data(date_ranges=date_range)
    assert len(result) == 1
    assert result[0]["影片ID"] == "vid_in_range"