import pytest
from unittest.mock import patch, MagicMock
from services.firebase import init_firestore

@patch("services.firebase.firebase_admin._apps", new=[])
@patch("services.firebase.firebase_admin.initialize_app")
@patch("services.firebase.firestore.client")
@patch("services.firebase.credentials.Certificate")
@patch("os.path.exists", return_value=True)
def test_init_firestore_success(mock_exists, mock_cert, mock_client, mock_init_app):
    client = init_firestore()
    mock_cert.assert_called_once_with("firebase-key.json")
    mock_init_app.assert_called_once()
    mock_client.assert_called_once()
    assert client == mock_client()

@patch("os.path.exists", return_value=False)
def test_init_firestore_key_missing(mock_exists):
    with pytest.raises(FileNotFoundError) as excinfo:
        init_firestore()
    assert "找不到 firebase-key.json" in str(excinfo.value)

@patch("services.firebase.firebase_admin._apps", new=[])
@patch("services.firebase.credentials.Certificate", side_effect=Exception("憑證錯誤"))
@patch("os.path.exists", return_value=True)
def test_init_firestore_failure_logs_error(mock_exists, mock_cert):
    with pytest.raises(Exception) as excinfo:
        init_firestore()
    assert "憑證錯誤" in str(excinfo.value)
