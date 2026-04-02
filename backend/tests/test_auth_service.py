"""
services/firestore/auth_service.py 的測試

使用 Firestore emulator 取代 MagicMock，KMS 使用 plaintext fallback。
Firestore error 場景（GoogleAPIError）保留 mock，因為 emulator 不會自然產生此錯誤。
"""

from unittest.mock import MagicMock

import pytest
from google.api_core.exceptions import GoogleAPIError

from services.firestore.auth_service import get_refresh_token, save_channel_auth


class TestSaveChannelAuth:
    def test_saves_token_to_firestore(self, db):
        """寫入後能從 Firestore 讀回正確的 token（KMS plaintext fallback）"""
        save_channel_auth(db, "UC_test", "raw_refresh_token")

        doc = (
            db.collection("channel_data")
            .document("UC_test")
            .collection("channel_info")
            .document("meta")
            .get()
        )
        assert doc.exists
        data = doc.to_dict()
        # plaintext fallback：token 原樣存入
        assert data["refresh_token"] == "raw_refresh_token"
        assert "authorized_at" in data

    def test_merge_preserves_existing_fields(self, db):
        """set(merge=True) 不應覆蓋既有欄位"""
        meta_ref = (
            db.collection("channel_data")
            .document("UC_test")
            .collection("channel_info")
            .document("meta")
        )
        meta_ref.set({"existing_field": "keep_me"})

        save_channel_auth(db, "UC_test", "new_token")

        data = meta_ref.get().to_dict()
        assert data["existing_field"] == "keep_me"
        assert data["refresh_token"] == "new_token"

    def test_raises_on_firestore_error(self):
        """Firestore 寫入錯誤時應拋出 GoogleAPIError"""
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.set.side_effect = GoogleAPIError(
            "write failed"
        )

        with pytest.raises(GoogleAPIError):
            save_channel_auth(mock_db, "UC_test", "token")


class TestGetRefreshToken:
    def test_returns_token_from_firestore(self, db):
        """能正確讀回之前存入的 token"""
        # 先 seed 資料
        db.collection("channel_data").document("UC_test").collection("channel_info").document(
            "meta"
        ).set({"refresh_token": "stored_token"})

        result = get_refresh_token(db, "UC_test")
        # plaintext fallback：kms_decrypt 原樣回傳
        assert result == "stored_token"

    def test_returns_none_when_doc_not_exists(self, db):
        assert get_refresh_token(db, "UC_nonexistent") is None

    def test_returns_none_when_token_field_empty(self, db):
        db.collection("channel_data").document("UC_test").collection("channel_info").document(
            "meta"
        ).set({"refresh_token": ""})

        assert get_refresh_token(db, "UC_test") is None

    def test_returns_none_on_google_api_error(self):
        """Firestore 讀取錯誤時回傳 None"""
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.get.side_effect = GoogleAPIError(
            "read failed"
        )

        assert get_refresh_token(mock_db, "UC_test") is None

    def test_roundtrip_save_then_get(self, db):
        """完整 roundtrip：save → get 應取回相同 token"""
        save_channel_auth(db, "UC_roundtrip", "my_secret_token")
        result = get_refresh_token(db, "UC_roundtrip")
        assert result == "my_secret_token"
