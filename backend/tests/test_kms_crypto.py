"""
kms_crypto 測試：KMS 加解密工具，mock Google Cloud KMS client
"""

import base64
import os
import sys
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def _reset_kms_cache():
    import utils.kms_crypto as mod

    mod._kms_key_name = None
    yield
    mod._kms_key_name = None


class TestGetKeyName:
    def test_returns_empty_when_not_configured(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("GOOGLE_CLOUD_PROJECT", None)
            os.environ.pop("KMS_KEY_RING", None)
            os.environ.pop("KMS_KEY_ID", None)
            from utils.kms_crypto import _get_key_name

            result = _get_key_name()
            assert result == ""

    def test_returns_key_name_when_configured(self):
        env = {
            "GOOGLE_CLOUD_PROJECT": "my-project",
            "KMS_KEY_RING": "my-ring",
            "KMS_KEY_ID": "my-key",
            "KMS_LOCATION": "us-central1",
        }
        with patch.dict(os.environ, env, clear=False):
            from utils.kms_crypto import _get_key_name

            result = _get_key_name()
            assert "my-project" in result
            assert "us-central1" in result
            assert "my-ring" in result
            assert "my-key" in result

    def test_caches_result(self):
        import utils.kms_crypto as mod

        mod._kms_key_name = "cached-value"
        assert mod._get_key_name() == "cached-value"


class TestIsKmsConfigured:
    def test_false_when_not_configured(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("GOOGLE_CLOUD_PROJECT", None)
            os.environ.pop("KMS_KEY_RING", None)
            os.environ.pop("KMS_KEY_ID", None)
            from utils.kms_crypto import is_kms_configured

            assert is_kms_configured() is False


@pytest.fixture
def mock_kms_client():
    """提供一個 mock KMS client，並注入到 sys.modules"""
    mock_client = MagicMock()
    mock_kms_module = MagicMock()
    mock_kms_module.KeyManagementServiceClient.return_value = mock_client

    original = sys.modules.get("google.cloud.kms")
    sys.modules["google.cloud.kms"] = mock_kms_module
    yield mock_client
    if original is not None:
        sys.modules["google.cloud.kms"] = original
    else:
        sys.modules.pop("google.cloud.kms", None)


@pytest.fixture
def kms_env():
    env = {
        "GOOGLE_CLOUD_PROJECT": "proj",
        "KMS_KEY_RING": "ring",
        "KMS_KEY_ID": "key",
    }
    with patch.dict(os.environ, env, clear=False):
        yield


class TestIsDeployedEnv:
    def test_production_is_deployed(self):
        with patch.dict(os.environ, {"FIRESTORE_DATABASE": "(default)"}, clear=False):
            from utils.kms_crypto import _is_deployed_env

            assert _is_deployed_env() is True

    def test_staging_is_deployed(self):
        with patch.dict(os.environ, {"FIRESTORE_DATABASE": "staging"}, clear=False):
            from utils.kms_crypto import _is_deployed_env

            assert _is_deployed_env() is True

    def test_empty_is_not_deployed(self):
        with patch.dict(os.environ, {}, clear=True):
            from utils.kms_crypto import _is_deployed_env

            assert _is_deployed_env() is False

    def test_other_value_is_not_deployed(self):
        with patch.dict(os.environ, {"FIRESTORE_DATABASE": "test-db"}, clear=False):
            from utils.kms_crypto import _is_deployed_env

            assert _is_deployed_env() is False


class TestKmsEncrypt:
    def test_returns_plaintext_when_not_configured_local(self):
        """本地開發環境（非部署）允許 fallback 回傳明文"""
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("GOOGLE_CLOUD_PROJECT", None)
            os.environ.pop("KMS_KEY_RING", None)
            os.environ.pop("FIRESTORE_DATABASE", None)
            from utils.kms_crypto import kms_encrypt

            result = kms_encrypt("my-secret")
            assert result == "my-secret"

    def test_raises_when_not_configured_in_production(self):
        """Production 環境缺少 KMS 設定時必須 raise"""
        with patch.dict(
            os.environ,
            {"FIRESTORE_DATABASE": "(default)"},
            clear=True,
        ):
            from utils.kms_crypto import kms_encrypt

            with pytest.raises(RuntimeError, match="禁止在部署環境以明文儲存"):
                kms_encrypt("my-secret")

    def test_raises_when_not_configured_in_staging(self):
        """Staging 環境缺少 KMS 設定時必須 raise"""
        with patch.dict(
            os.environ,
            {"FIRESTORE_DATABASE": "staging"},
            clear=True,
        ):
            from utils.kms_crypto import kms_encrypt

            with pytest.raises(RuntimeError, match="禁止在部署環境以明文儲存"):
                kms_encrypt("my-secret")

    def test_encrypts_with_kms(self, mock_kms_client, kms_env):
        mock_response = MagicMock()
        mock_response.ciphertext = b"encrypted-bytes"
        mock_kms_client.encrypt.return_value = mock_response

        from utils.kms_crypto import kms_encrypt

        result = kms_encrypt("my-secret")
        expected = base64.b64encode(b"encrypted-bytes").decode("utf-8")
        assert result == expected
        mock_kms_client.encrypt.assert_called_once()


class TestKmsDecrypt:
    def test_returns_plaintext_when_not_configured(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("GOOGLE_CLOUD_PROJECT", None)
            os.environ.pop("KMS_KEY_RING", None)
            from utils.kms_crypto import kms_decrypt

            result = kms_decrypt("my-secret")
            assert result == "my-secret"

    def test_decrypts_with_kms(self, mock_kms_client, kms_env):
        mock_response = MagicMock()
        mock_response.plaintext = b"decrypted-text"
        mock_kms_client.decrypt.return_value = mock_response

        ciphertext = base64.b64encode(b"some-cipher").decode("utf-8")

        from utils.kms_crypto import kms_decrypt

        result = kms_decrypt(ciphertext)
        assert result == "decrypted-text"

    def test_kms_decrypt_failure_returns_original(self, mock_kms_client, kms_env):
        mock_kms_client.decrypt.side_effect = Exception("KMS error")

        ciphertext = base64.b64encode(b"old-data").decode("utf-8")

        from utils.kms_crypto import kms_decrypt

        result = kms_decrypt(ciphertext)
        assert result == ciphertext
