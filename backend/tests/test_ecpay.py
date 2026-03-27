"""
ECPay 金流服務測試：AES 解密、CheckMacValue 驗證、金額分桶、重複防護
"""

import base64
import hashlib
import json
import urllib.parse
from unittest.mock import MagicMock

import pytest
from Crypto.Cipher import AES

from services.ecpay_service import (
    HASH_IV,
    HASH_KEY,
    MERCHANT_ID,
    aes_decrypt,
    generate_check_mac_value_for_livestream,
    get_amount_bucket,
    handle_ecpay_return,
    pad_pkcs7,
)

# ═══════════════════════════════════════════════════════
# 輔助函數：用已知 key/iv 加密測試資料
# ═══════════════════════════════════════════════════════


def _aes_encrypt(plaintext: str, key: str, iv: str) -> str:
    """AES-128-CBC 加密後 Base64 encode，供測試用"""
    cipher = AES.new(key.encode("utf-8"), AES.MODE_CBC, iv.encode("utf-8"))
    padded = pad_pkcs7(plaintext.encode("utf-8"))
    encrypted = cipher.encrypt(padded)
    return base64.b64encode(encrypted).decode("utf-8")


# ═══════════════════════════════════════════════════════
# AES 解密
# ═══════════════════════════════════════════════════════


class TestAesDecrypt:
    """自己加密再解密，驗證 round-trip 正確"""

    def test_roundtrip_plain_text(self):
        original = "Hello=World&Foo=Bar"
        encrypted = _aes_encrypt(original, HASH_KEY, HASH_IV)

        url_decoded, raw_decrypted = aes_decrypt(encrypted, HASH_KEY, HASH_IV)

        assert raw_decrypted == original
        assert url_decoded == urllib.parse.unquote(original)

    def test_roundtrip_url_encoded_text(self):
        """ECPay 實際回傳的明文是 URL encoded"""
        original_data = {"TradeNo": "12345", "TradeAmt": "100"}
        url_encoded = urllib.parse.urlencode(original_data)
        encrypted = _aes_encrypt(url_encoded, HASH_KEY, HASH_IV)

        url_decoded, raw_decrypted = aes_decrypt(encrypted, HASH_KEY, HASH_IV)

        assert raw_decrypted == url_encoded
        # url_decoded 後可以解回原始 key=value
        assert "TradeNo=12345" in url_decoded


# ═══════════════════════════════════════════════════════
# CheckMacValue 計算（踩坑核心）
# ═══════════════════════════════════════════════════════


class TestCheckMacValue:
    """
    驗證公式：SHA256(lowercase(HashKey + AES解密原始字串 + HashIV))
    這個公式跟官方文件描述不同，是實際測試後得出的結果
    """

    def test_known_input_produces_expected_hash(self):
        raw_decrypted = "TradeNo%3D12345%26TradeAmt%3D100"

        # 手動計算預期結果
        raw_string = (HASH_KEY + raw_decrypted + HASH_IV).lower()
        expected = hashlib.sha256(raw_string.encode("utf-8")).hexdigest().upper()

        result = generate_check_mac_value_for_livestream(raw_decrypted, HASH_KEY, HASH_IV)
        assert result == expected

    def test_different_input_produces_different_hash(self):
        hash1 = generate_check_mac_value_for_livestream("data_a", HASH_KEY, HASH_IV)
        hash2 = generate_check_mac_value_for_livestream("data_b", HASH_KEY, HASH_IV)
        assert hash1 != hash2

    def test_output_is_uppercase_hex(self):
        result = generate_check_mac_value_for_livestream("test", HASH_KEY, HASH_IV)
        assert result == result.upper()
        assert all(c in "0123456789ABCDEF" for c in result)


# ═══════════════════════════════════════════════════════
# 金額分桶 — 邊界值測試
# ═══════════════════════════════════════════════════════


class TestGetAmountBucket:
    @pytest.mark.parametrize(
        "amount,expected",
        [
            ("0", "30"),
            ("30", "30"),
            ("74", "30"),
            ("75", "75"),  # 邊界：剛好 75 歸 "75"
            ("149", "75"),
            ("150", "150"),  # 邊界
            ("299", "150"),
            ("300", "300"),  # 邊界
            ("749", "300"),
            ("750", "750"),  # 邊界
            ("1499", "750"),
            ("1500", "1500"),  # 邊界
            ("9999", "1500"),
        ],
    )
    def test_boundary_values(self, amount, expected):
        assert get_amount_bucket(amount) == expected

    def test_float_string(self):
        """支援 "100.0" 格式"""
        assert get_amount_bucket("100.0") == "75"

    def test_invalid_string_defaults_to_30(self):
        """無法解析的金額預設歸 "30" """
        assert get_amount_bucket("abc") == "30"
        assert get_amount_bucket("") == "30"


# ═══════════════════════════════════════════════════════
# handle_ecpay_return 整合測試
# ═══════════════════════════════════════════════════════


class TestHandleEcpayReturn:
    """測試完整的付款通知處理流程"""

    def _make_valid_form(self):
        """建構一組能通過驗證的 ECPay 表單資料"""
        order_data = json.dumps(
            {
                "OrderInfo": {
                    "TradeNo": "TN20260326001",
                    "TradeAmt": "150",
                    "PaymentDate": "2026/03/26 12:00:00",
                }
            }
        )
        # 先 URL encode 再 AES 加密（模擬 ECPay 的實際行為）
        url_encoded = urllib.parse.quote(order_data)
        encrypted = _aes_encrypt(url_encoded, HASH_KEY, HASH_IV)

        # 計算正確的 CheckMacValue
        mac = generate_check_mac_value_for_livestream(url_encoded, HASH_KEY, HASH_IV)

        return {
            "MerchantID": MERCHANT_ID,
            "Data": encrypted,
            "CheckMacValue": mac,
        }

    def test_valid_payment_returns_ok(self):
        mock_db = MagicMock()
        # Firestore get 回傳空 document（沒有重複）
        mock_db.collection.return_value.document.return_value.get.return_value.to_dict.return_value = None

        form = self._make_valid_form()
        result = handle_ecpay_return(form, mock_db)

        assert result == "1|OK"

    def test_wrong_mac_returns_fail(self):
        mock_db = MagicMock()
        form = self._make_valid_form()
        form["CheckMacValue"] = "WRONG_MAC_VALUE"

        result = handle_ecpay_return(form, mock_db)
        assert result == "0|FAIL"

    def test_wrong_merchant_id_raises(self):
        mock_db = MagicMock()
        form = self._make_valid_form()
        form["MerchantID"] = "WRONG_ID"

        with pytest.raises(ValueError, match="MerchantID"):
            handle_ecpay_return(form, mock_db)

    def test_duplicate_trade_no_skips_write(self):
        """重複的 TradeNo 不應重複寫入"""
        mock_db = MagicMock()

        # Firestore 已經有這筆 TradeNo
        existing_doc = {"items": [{"OrderInfo": {"TradeNo": "TN20260326001"}}]}
        mock_db.collection.return_value.document.return_value.get.return_value.to_dict.return_value = existing_doc

        form = self._make_valid_form()
        result = handle_ecpay_return(form, mock_db)

        assert result == "1|OK"
        # 確認沒有呼叫 set()（因為是重複的）
        mock_db.collection.return_value.document.return_value.set.assert_not_called()
