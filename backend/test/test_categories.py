import pytest
from unittest.mock import MagicMock, patch
from services.categories import get_all_categories, sync_category

def test_get_all_categories_success():
    mock_cat1 = MagicMock(id="1", to_dict=lambda: {"name": "科技"})
    mock_cat2 = MagicMock(id="2", to_dict=lambda: {"name": "遊戲"})
    mock_db = MagicMock()
    mock_db.collection().stream.return_value = [mock_cat1, mock_cat2]

    result = get_all_categories(mock_db)
    assert result == [
        {"id": "1", "name": "科技"},
        {"id": "2", "name": "遊戲"},
    ]

def test_get_all_categories_error():
    mock_db = MagicMock()
    mock_db.collection().stream.side_effect = Exception("讀取錯誤")

    result = get_all_categories(mock_db)
    assert result == []

def test_sync_category_add_new():
    mock_db = MagicMock()
    mock_db.collection().where.return_value.get.return_value = []
    item = {"name": "AI", "keywords": ["人工智慧"]}
    sync_category(mock_db, item)

    mock_db.collection().add.assert_called_once_with({"name": "AI", "keywords": ["人工智慧"]})

def test_sync_category_merge_keywords():
    doc = MagicMock()
    doc.id = "abc"
    doc.to_dict.return_value = {"keywords": ["科技"]}
    mock_db = MagicMock()
    mock_db.collection().where.return_value.get.return_value = [doc]

    item = {"name": "AI", "keywords": ["人工智慧", "科技"], "mode": "sync"}
    sync_category(mock_db, item)

    mock_db.collection().document.assert_called_with("abc")
    called_args = mock_db.collection().document().update.call_args[0][0]
    assert sorted(called_args["keywords"]) == sorted(["人工智慧", "科技"])


def test_sync_category_replace_keywords():
    doc = MagicMock()
    doc.id = "abc"
    mock_db = MagicMock()
    mock_db.collection().where.return_value.get.return_value = [doc]

    item = {"name": "AI", "keywords": ["新關鍵字"], "mode": "replace"}
    sync_category(mock_db, item)

    mock_db.collection().document.assert_called_with("abc")
    mock_db.collection().document().update.assert_called_once_with({"keywords": ["新關鍵字"]})

def test_sync_category_invalid_input(caplog):
    mock_db = MagicMock()
    with caplog.at_level("WARNING"):
        sync_category(mock_db, {"name": "", "keywords": "這不是list"})  # name 空 + keywords 非 list
        assert "傳入資料格式錯誤" in caplog.text
    mock_db.collection().add.assert_not_called()

def test_sync_category_exception_handling():
    mock_db = MagicMock()
    mock_db.collection().where.side_effect = Exception("故意出錯")

    item = {"name": "測試", "keywords": ["X"]}
    sync_category(mock_db, item)  # 不會拋錯，但應該要記錄 log（不在此驗證）
