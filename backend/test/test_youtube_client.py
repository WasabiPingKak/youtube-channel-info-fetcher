import pytest
from unittest.mock import patch, MagicMock
from services.youtube.client import (
    get_youtube_service,
    get_channel_id,
    get_uploads_playlist_id
)

@patch("services.youtube.client.googleapiclient.discovery.build")
def test_get_youtube_service_success(mock_build):
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    result = get_youtube_service("fake-api-key")
    mock_build.assert_called_once_with("youtube", "v3", developerKey="fake-api-key")
    assert result == mock_service

@patch("services.youtube.client.googleapiclient.discovery.build", side_effect=Exception("API error"))
def test_get_youtube_service_fail(mock_build):
    result = get_youtube_service("invalid-key")
    assert result is None

def test_get_channel_id_with_direct_id():
    assert get_channel_id(None, "UCabc123") == "UCabc123"

@patch("services.youtube.client.logging")
def test_get_channel_id_with_username(mock_logging):
    mock_youtube = MagicMock()
    mock_youtube.search().list().execute.return_value = {
        "items": [{"snippet": {"channelId": "UCxyz999"}}]
    }
    result = get_channel_id(mock_youtube, "@testuser")
    assert result == "UCxyz999"

@patch("services.youtube.client.logging")
def test_get_channel_id_not_found(mock_logging):
    mock_youtube = MagicMock()
    mock_youtube.search().list().execute.return_value = {"items": []}
    result = get_channel_id(mock_youtube, "@unknown")
    assert result is None

@patch("services.youtube.client.logging")
@patch("services.youtube.client.googleapiclient.errors.HttpError", new=Exception)
def test_get_channel_id_http_error(mock_logging):
    mock_youtube = MagicMock()
    mock_youtube.search().list().execute.side_effect = Exception("HTTP Error")
    result = get_channel_id(mock_youtube, "@erroruser")
    assert result is None

@patch("services.youtube.client.logging")
def test_get_uploads_playlist_id_success(mock_logging):
    mock_youtube = MagicMock()
    mock_youtube.channels().list().execute.return_value = {
        "items": [{
            "contentDetails": {
                "relatedPlaylists": {"uploads": "UUabc123uploads"}
            }
        }]
    }
    result = get_uploads_playlist_id(mock_youtube, "UCabc123")
    assert result == "UUabc123uploads"

@patch("services.youtube.client.logging")
def test_get_uploads_playlist_id_no_items(mock_logging):
    mock_youtube = MagicMock()
    mock_youtube.channels().list().execute.return_value = {"items": []}
    result = get_uploads_playlist_id(mock_youtube, "UCempty")
    assert result is None

@patch("services.youtube.client.logging")
def test_get_uploads_playlist_id_error(mock_logging):
    mock_youtube = MagicMock()
    mock_youtube.channels().list().execute.side_effect = Exception("API Error")
    result = get_uploads_playlist_id(mock_youtube, "UCerror")
    assert result is None

@patch("services.youtube.client.logging")
def test_get_channel_id_generic_exception(mock_logging):
    mock_youtube = MagicMock()
    # 模擬非 HttpError 的錯誤，例如 KeyError
    mock_youtube.search().list().execute.side_effect = KeyError("錯誤 key")

    result = get_channel_id(mock_youtube, "@errorcase")
    assert result is None
    assert "發生未預期錯誤" in mock_logging.error.call_args[0][0]
