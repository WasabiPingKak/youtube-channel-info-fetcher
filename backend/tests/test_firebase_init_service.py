"""services/firebase_init_service.py 的單元測試"""

from unittest.mock import MagicMock, patch

import pytest


class TestInitFirestore:
    @patch("services.firebase_init_service.firestore")
    @patch("services.firebase_init_service.firebase_admin")
    @patch("services.firebase_init_service.credentials")
    @patch("services.firebase_init_service.os.path.exists", return_value=True)
    @patch.dict("os.environ", {"FIRESTORE_DATABASE": "test-db"}, clear=False)
    def test_initializes_with_key_file(self, _exists, mock_creds, mock_admin, mock_fs):
        mock_admin._apps = {}
        mock_db = MagicMock()
        mock_fs.client.return_value = mock_db

        from services.firebase_init_service import init_firestore

        result = init_firestore()

        mock_creds.Certificate.assert_called_once()
        mock_admin.initialize_app.assert_called_once()
        mock_fs.client.assert_called_once_with(database_id="test-db")
        assert result == mock_db

    @patch("services.firebase_init_service.firestore")
    @patch("services.firebase_init_service.firebase_admin")
    @patch("services.firebase_init_service.credentials")
    @patch("services.firebase_init_service.os.path.exists", return_value=False)
    @patch.dict("os.environ", {"FIRESTORE_DATABASE": "(default)"}, clear=False)
    def test_initializes_with_adc(self, _exists, _creds, mock_admin, mock_fs):
        mock_admin._apps = {}
        mock_db = MagicMock()
        mock_fs.client.return_value = mock_db

        from services.firebase_init_service import init_firestore

        result = init_firestore()

        # ADC 模式不需要 Certificate
        mock_admin.initialize_app.assert_called_once_with()
        assert result == mock_db

    @patch("services.firebase_init_service.firestore")
    @patch("services.firebase_init_service.firebase_admin")
    @patch.dict("os.environ", {"FIRESTORE_DATABASE": "staging"}, clear=False)
    def test_skips_init_when_already_initialized(self, mock_admin, mock_fs):
        mock_admin._apps = {"[DEFAULT]": MagicMock()}
        mock_db = MagicMock()
        mock_fs.client.return_value = mock_db

        from services.firebase_init_service import init_firestore

        result = init_firestore()

        mock_admin.initialize_app.assert_not_called()
        assert result == mock_db

    @patch("services.firebase_init_service.firestore")
    @patch("services.firebase_init_service.firebase_admin")
    @patch("services.firebase_init_service.os.path.exists", return_value=False)
    @patch.dict("os.environ", {"FIRESTORE_DATABASE": "(default)"}, clear=False)
    def test_raises_on_init_failure(self, _exists, mock_admin, _fs):
        mock_admin._apps = {}
        mock_admin.initialize_app.side_effect = Exception("init failed")

        from services.firebase_init_service import init_firestore

        with pytest.raises(Exception, match="init failed"):
            init_firestore()
