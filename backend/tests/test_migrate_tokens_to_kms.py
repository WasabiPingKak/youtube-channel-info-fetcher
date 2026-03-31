"""
migrate_tokens_to_kms 測試：批次加密明文 refresh_token
"""

import base64
from unittest.mock import MagicMock, patch

from tools.migrate_tokens_to_kms import is_plaintext_token, migrate_tokens


class TestIsPlaintextToken:
    """測試明文 token 偵測邏輯"""

    def test_google_refresh_token_is_plaintext(self):
        """Google OAuth refresh_token 格式（1//xxx）應被判定為明文"""
        assert is_plaintext_token("1//0abc-DEFghijk_token") is True

    def test_random_string_is_plaintext(self):
        """隨機字串應被判定為明文"""
        assert is_plaintext_token("some-random_token-value") is True

    def test_base64_encoded_is_not_plaintext(self):
        """合法 base64 編碼（KMS 加密結果）應被判定為已加密"""
        encrypted = base64.b64encode(b"kms-encrypted-bytes").decode("utf-8")
        assert is_plaintext_token(encrypted) is False

    def test_empty_string(self):
        """空字串（base64 合法）應被判定為已加密"""
        assert is_plaintext_token("") is False


class TestMigrateTokens:
    """測試批次遷移邏輯"""

    def _make_meta_doc(self, channel_id: str, token_value: str | None):
        """建立一個 mock meta document，模擬 collection_group 查詢結果"""
        doc = MagicMock()
        doc.reference.path = f"channel_data/{channel_id}/channel_info/meta"
        doc.reference.update = MagicMock()

        if token_value is None:
            doc.to_dict.return_value = {}
        else:
            doc.to_dict.return_value = {"refresh_token": token_value}

        return doc

    def _make_mock_db(self, channels: dict):
        """
        建立 mock Firestore client（使用 collection_group 查詢）。

        Args:
            channels: {channel_id: refresh_token_value | None}
                      None 表示 meta 文件存在但無 token 欄位
        """
        db = MagicMock()

        meta_docs = [self._make_meta_doc(cid, token) for cid, token in channels.items()]

        db.collection_group.return_value.stream.return_value = iter(meta_docs)
        return db

    def test_dry_run_does_not_write(self):
        """dry_run 模式不應寫入 Firestore"""
        db = self._make_mock_db({"UC001": "1//0abc-DEFghijk_token"})

        with patch("tools.migrate_tokens_to_kms.kms_encrypt") as mock_encrypt:
            stats = migrate_tokens(db, dry_run=True)

        assert stats["plaintext_found"] == 1
        assert stats["encrypted"] == 0
        mock_encrypt.assert_not_called()

    def test_encrypts_plaintext_token(self):
        """應將明文 token 加密並寫回"""
        db = self._make_mock_db({"UC001": "1//0abc-DEFghijk_token"})

        with patch("tools.migrate_tokens_to_kms.kms_encrypt", return_value="encrypted-result"):
            stats = migrate_tokens(db, dry_run=False)

        assert stats["plaintext_found"] == 1
        assert stats["encrypted"] == 1
        assert stats["errors"] == 0

    def test_skips_already_encrypted_token(self):
        """已加密的 token 應被略過"""
        encrypted = base64.b64encode(b"already-encrypted").decode("utf-8")
        db = self._make_mock_db({"UC001": encrypted})

        with patch("tools.migrate_tokens_to_kms.kms_encrypt") as mock_encrypt:
            stats = migrate_tokens(db, dry_run=False)

        assert stats["already_encrypted"] == 1
        assert stats["plaintext_found"] == 0
        mock_encrypt.assert_not_called()

    def test_skips_channel_without_token(self):
        """無 refresh_token 的頻道應被略過"""
        db = self._make_mock_db({"UC001": None})

        stats = migrate_tokens(db, dry_run=False)

        assert stats["skipped_no_token"] == 1
        assert stats["plaintext_found"] == 0

    def test_handles_encrypt_error(self):
        """加密失敗時應記錄錯誤並繼續"""
        db = self._make_mock_db(
            {
                "UC001": "1//0abc-token_fail",
                "UC002": "1//0abc-token_ok",
            }
        )

        call_count = 0

        def mock_encrypt_side_effect(token):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise RuntimeError("KMS unavailable")
            return "encrypted-ok"

        with patch(
            "tools.migrate_tokens_to_kms.kms_encrypt",
            side_effect=mock_encrypt_side_effect,
        ):
            stats = migrate_tokens(db, dry_run=False)

        assert stats["plaintext_found"] == 2
        assert stats["encrypted"] == 1
        assert stats["errors"] == 1

    def test_mixed_channels(self):
        """混合情境：明文、已加密、無 token"""
        encrypted = base64.b64encode(b"already-encrypted").decode("utf-8")
        db = self._make_mock_db(
            {
                "UC001": "1//0abc-DEF_plain",
                "UC002": encrypted,
                "UC003": None,
            }
        )

        with patch("tools.migrate_tokens_to_kms.kms_encrypt", return_value="enc"):
            stats = migrate_tokens(db, dry_run=False)

        assert stats["scanned"] == 3
        assert stats["plaintext_found"] == 1
        assert stats["already_encrypted"] == 1
        assert stats["skipped_no_token"] == 1
        assert stats["encrypted"] == 1

    def test_skips_non_meta_documents(self):
        """collection_group 回傳非 meta 文件時應略過"""
        db = MagicMock()

        # 一筆正常 meta，一筆非 meta 的 channel_info 文件
        meta_doc = self._make_meta_doc("UC001", "1//0abc-token_test")

        other_doc = MagicMock()
        other_doc.reference.path = "channel_data/UC002/channel_info/settings"
        other_doc.to_dict.return_value = {"some_field": "value"}

        db.collection_group.return_value.stream.return_value = iter([meta_doc, other_doc])

        with patch("tools.migrate_tokens_to_kms.kms_encrypt", return_value="enc"):
            stats = migrate_tokens(db, dry_run=False)

        assert stats["scanned"] == 1
        assert stats["plaintext_found"] == 1
