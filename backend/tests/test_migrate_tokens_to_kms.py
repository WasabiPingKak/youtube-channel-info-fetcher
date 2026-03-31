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

    def _make_mock_db(self, channels: dict):
        """
        建立 mock Firestore client。

        Args:
            channels: {channel_id: refresh_token_value | None}
                      None 表示 meta 文件不存在或無 token 欄位
        """
        db = MagicMock()

        # mock channel_data.stream() 回傳 channel 列表
        channel_docs = []
        for channel_id in channels:
            doc = MagicMock()
            doc.id = channel_id
            channel_docs.append(doc)

        # 建立每個 channel 的 meta mock
        meta_mocks = {}
        for channel_id, token_value in channels.items():
            meta_ref = MagicMock()
            meta_doc = MagicMock()

            if token_value is None:
                # meta 文件存在但無 refresh_token 欄位
                meta_doc.exists = True
                meta_doc.to_dict.return_value = {}
            else:
                meta_doc.exists = True
                meta_doc.to_dict.return_value = {"refresh_token": token_value}

            meta_ref.get.return_value = meta_doc
            meta_ref.update = MagicMock()
            meta_mocks[channel_id] = meta_ref

        # mock db.collection(...).document(...).collection(...).document(...)
        def mock_collection(collection_name):
            col = MagicMock()

            def mock_document(doc_id):
                doc_ref = MagicMock()

                def mock_sub_collection(sub_name):
                    sub_col = MagicMock()
                    sub_col.document = lambda sub_doc_id: meta_mocks.get(doc_id, MagicMock())
                    return sub_col

                doc_ref.collection = mock_sub_collection
                return doc_ref

            col.document = mock_document
            col.stream.return_value = iter(channel_docs)
            return col

        db.collection = mock_collection
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
