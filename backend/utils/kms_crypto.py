# utils/kms_crypto.py
# Google Cloud KMS 加解密工具

import base64
import logging
import os

logger = logging.getLogger(__name__)

_kms_key_name: str | None = None


def _get_key_name() -> str | None:
    """取得 KMS key resource name，格式：
    projects/{project}/locations/{location}/keyRings/{ring}/cryptoKeys/{key}
    """
    global _kms_key_name
    if _kms_key_name is not None:
        return _kms_key_name

    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("KMS_LOCATION", "asia-east1")
    key_ring = os.getenv("KMS_KEY_RING")
    key_id = os.getenv("KMS_KEY_ID")

    if not all([project, key_ring, key_id]):
        _kms_key_name = ""
        return ""

    _kms_key_name = (
        f"projects/{project}/locations/{location}/keyRings/{key_ring}/cryptoKeys/{key_id}"
    )
    return _kms_key_name


def is_kms_configured() -> bool:
    """檢查 KMS 環境變數是否已設定。"""
    return bool(_get_key_name())


def _is_deployed_env() -> bool:
    """判斷是否為部署環境（production 或 staging）。
    透過 FIRESTORE_DATABASE 環境變數判斷：Cloud Run 部署時一定會設定此值。
    """
    db = os.getenv("FIRESTORE_DATABASE", "")
    return db in ("(default)", "staging")


def kms_encrypt(plaintext: str) -> str:
    """
    使用 KMS 加密字串，回傳 base64 編碼的密文。
    部署環境（production / staging）若 KMS 未設定，直接 raise 阻止明文儲存。
    本地開發環境允許 fallback 回傳原文。
    """
    key_name = _get_key_name()
    if not key_name:
        if _is_deployed_env():
            raise RuntimeError(
                "KMS 未設定，禁止在部署環境以明文儲存 token。"
                "請確認環境變數 GOOGLE_CLOUD_PROJECT、KMS_KEY_RING、KMS_KEY_ID"
            )
        logger.warning("[KMS] ⚠️ KMS 未設定，refresh_token 將以明文儲存（僅限本地開發）")
        return plaintext

    from google.cloud import kms

    client = kms.KeyManagementServiceClient()
    response = client.encrypt(
        request={
            "name": key_name,
            "plaintext": plaintext.encode("utf-8"),
        }
    )
    encoded = base64.b64encode(response.ciphertext).decode("utf-8")
    logger.info("[KMS] ✅ 加密完成")
    return encoded


def kms_decrypt(ciphertext: str) -> str:
    """
    使用 KMS 解密 base64 編碼的密文，回傳明文。
    若 KMS 未設定，假設輸入為明文直接回傳（開發環境 fallback）。
    """
    key_name = _get_key_name()
    if not key_name:
        return ciphertext

    # 嘗試 base64 decode，若失敗代表是未加密的舊資料
    try:
        ciphertext_bytes = base64.b64decode(ciphertext)
    except Exception:
        logger.warning(
            "[KMS] ⚠️ 偵測到未加密的明文 token（非 base64 格式），"
            "請執行 migrate_tokens_to_kms.py 進行批次加密"
        )
        return ciphertext

    from google.cloud import kms

    client = kms.KeyManagementServiceClient()
    try:
        response = client.decrypt(
            request={
                "name": key_name,
                "ciphertext": ciphertext_bytes,
            }
        )
        logger.info("[KMS] ✅ 解密完成")
        return response.plaintext.decode("utf-8")
    except Exception:
        # KMS 解密失敗，可能是未加密的舊資料或 key rotation 問題
        logger.warning(
            "[KMS] ⚠️ KMS 解密失敗，視為未加密的舊資料直接回傳。"
            "若此訊息持續出現，請檢查 KMS key 狀態或執行 migrate_tokens_to_kms.py"
        )
        return ciphertext
