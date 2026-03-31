"""services/firestore/auth_service.py 的單元測試"""

from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import GoogleAPIError

from services.firestore.auth_service import get_refresh_token, save_channel_auth


class TestSaveChannelAuth:
    def setup_method(self):
        self.db = MagicMock()
        self.doc_ref = MagicMock()
        self.db.collection.return_value.document.return_value.collection.return_value.document.return_value = self.doc_ref

    @patch("services.firestore.auth_service.kms_encrypt", return_value="encrypted_token")
    def test_saves_encrypted_token(self, _mock_encrypt):
        save_channel_auth(self.db, "UC_test", "raw_refresh_token")

        self.doc_ref.set.assert_called_once()
        saved_data = self.doc_ref.set.call_args[0][0]
        assert saved_data["refresh_token"] == "encrypted_token"
        assert "authorized_at" in saved_data

    @patch("services.firestore.auth_service.kms_encrypt", return_value="enc")
    def test_raises_on_firestore_error(self, _mock_encrypt):
        self.doc_ref.set.side_effect = GoogleAPIError("write failed")

        with pytest.raises(GoogleAPIError):
            save_channel_auth(self.db, "UC_test", "token")


class TestGetRefreshToken:
    def setup_method(self):
        self.db = MagicMock()
        self.doc_ref = MagicMock()
        self.db.collection.return_value.document.return_value.collection.return_value.document.return_value = self.doc_ref

    @patch("services.firestore.auth_service.kms_decrypt", return_value="decrypted_token")
    def test_returns_decrypted_token(self, _mock_decrypt):
        doc = MagicMock()
        doc.exists = True
        doc.to_dict.return_value = {"refresh_token": "encrypted_value"}
        self.doc_ref.get.return_value = doc

        result = get_refresh_token(self.db, "UC_test")

        assert result == "decrypted_token"

    def test_returns_none_when_doc_not_exists(self):
        doc = MagicMock()
        doc.exists = False
        self.doc_ref.get.return_value = doc

        assert get_refresh_token(self.db, "UC_test") is None

    @patch("services.firestore.auth_service.kms_decrypt")
    def test_returns_none_when_token_field_empty(self, _mock_decrypt):
        doc = MagicMock()
        doc.exists = True
        doc.to_dict.return_value = {"refresh_token": ""}
        self.doc_ref.get.return_value = doc

        assert get_refresh_token(self.db, "UC_test") is None

    def test_returns_none_on_google_api_error(self):
        self.doc_ref.get.side_effect = GoogleAPIError("read failed")

        assert get_refresh_token(self.db, "UC_test") is None
