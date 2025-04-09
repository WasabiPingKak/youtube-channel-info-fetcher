import pytest
from unittest.mock import MagicMock, patch
from services.cache import refresh_video_cache

@patch("services.cache.get_video_data")
@patch("services.cache.get_latest_cache")
def test_add_new_video_to_cache(mock_get_latest_cache, mock_get_video_data):
    mock_get_latest_cache.return_value = [{"影片ID": "A", "標題": "舊影片A"}]
    mock_get_video_data.return_value = [
        {"標題": "影片但缺ID"},  # 👈 故意少了影片ID 來覆蓋 warning 路徑
        {"影片ID": "A", "標題": "舊影片A"},
        {"影片ID": "B", "標題": "新影片B"}
    ]
    mock_db = MagicMock()

    merged, new_data = refresh_video_cache(mock_db)

    assert len(new_data) == 1
    assert new_data[0]["影片ID"] == "B"

    saved = mock_db.collection().document().set.call_args[0][0]["data"]
    assert {"A", "B"} == {v["影片ID"] for v in saved}

@patch("services.cache.get_video_data", side_effect=Exception("API 錯誤"))
@patch("services.cache.get_latest_cache", return_value=[])
def test_handle_api_error(mock_cache, mock_fetch):
    mock_db = MagicMock()
    merged, new_data = refresh_video_cache(mock_db)

    assert merged == []
    assert new_data == []

@patch("services.cache.get_video_data", return_value=[])
@patch("services.cache.get_latest_cache", return_value=[{"影片ID": "X"}])
def test_no_new_videos(mock_cache, mock_fetch):
    mock_db = MagicMock()
    merged, new_data = refresh_video_cache(mock_db)

    assert len(new_data) == 0
    assert len(merged) == 1
    assert merged[0]["影片ID"] == "X"
@patch("services.cache.get_video_data")
def test_overwrite_video_cache_success(mock_get_video_data):
    mock_get_video_data.return_value = [
        {"影片ID": "Z", "標題": "新影片Z"}
    ]
    mock_db = MagicMock()
    from services.cache import overwrite_video_cache
    result = overwrite_video_cache(mock_db, date_ranges=["2023-01-01", "2023-12-31"])
    assert result == [{"影片ID": "Z", "標題": "新影片Z"}]
    mock_db.collection().document().set.assert_called_once_with({"data": result})

@patch("services.cache.get_video_data", side_effect=Exception("API error"))
def test_overwrite_video_cache_error(mock_get_video_data):
    mock_db = MagicMock()
    from services.cache import overwrite_video_cache
    result = overwrite_video_cache(mock_db, date_ranges=["2023-01-01", "2023-12-31"])
    assert result == []

def test_get_latest_cache_success():
    # 模擬 Firestore 文件
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"data": [{"影片ID": "X"}]}
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = mock_doc

    from services.cache import get_latest_cache
    result = get_latest_cache(mock_db)
    assert result == [{"影片ID": "X"}]

def test_get_latest_cache_error():
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = Exception("Firestore error")

    from services.cache import get_latest_cache
    result = get_latest_cache(mock_db)
    assert result == []