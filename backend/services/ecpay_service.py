import base64
import hashlib
import logging
import urllib.parse
import json
import os
from Crypto.Cipher import AES
from firebase_admin import firestore
from datetime import datetime, timezone

MERCHANT_ID = os.getenv("ECPAY_MERCHANT_ID")
HASH_KEY = os.getenv("ECPAY_HASH_KEY")
HASH_IV = os.getenv("ECPAY_HASH_IV")

def pad_pkcs7(data: bytes) -> bytes:
    """補齊 PKCS7 Padding（若用 pycryptodome 已自帶，可省略）"""
    pad_len = 16 - len(data) % 16
    return data + bytes([pad_len] * pad_len)

def unpad_pkcs7(data: bytes) -> bytes:
    """去除 PKCS7 Padding"""
    pad_len = data[-1]
    return data[:-pad_len]

def aes_decrypt(data: str, key: str, iv: str) -> tuple:
    """解密 AES-128-CBC 的 Base64 字串，回傳 (URL decoded 明文, URL decode 前原始字串)"""
    cipher = AES.new(key.encode("utf-8"), AES.MODE_CBC, iv.encode("utf-8"))
    decoded = base64.b64decode(data)
    decrypted = cipher.decrypt(decoded)
    unpadded = unpad_pkcs7(decrypted)
    raw_decrypted = unpadded.decode("utf-8")
    url_decoded = urllib.parse.unquote(raw_decrypted)
    return url_decoded, raw_decrypted

def generate_check_mac_value_for_livestream(raw_decrypted: str, hash_key: str, hash_iv: str) -> str:
    """
    根據直播主收款API規格計算CheckMacValue
    參考：https://developers.ecpay.com.tw/41068/

    實際驗證結果：公式為 SHA256(lowercase(HashKey值 + AES解密原始字串 + HashIV值))
    - AES 解密後的原始字串本身已是 URL encoded，不需再做 URL encode/decode
    - 文件範例的 Data 明文恰好不含特殊字元，URL encode 前後無差異，因此文件描述有誤導性
    """
    raw_string = (hash_key + raw_decrypted + hash_iv).lower()
    return hashlib.sha256(raw_string.encode('utf-8')).hexdigest().upper()

# 原本的函數保留給一般API使用
def generate_check_mac_value(data: dict) -> str:
    """原本的CheckMacValue計算方式（適用於一般金流API）"""
    sorted_items = sorted(data.items())
    raw = f"HashKey={HASH_KEY}&" + "&".join(
        f"{k}={v}" for k, v in sorted_items
    ) + f"&HashIV={HASH_IV}"
    logging.debug("[ECPay] ➕ 原始待 encode 字串: %s", raw)
    encoded = urllib.parse.quote_plus(raw).lower()
    encoded = encoded.replace("%21", "!").replace("%28", "(").replace("%29", ")") \
                     .replace("%2a", "*").replace("%2d", "-").replace("%2e", ".") \
                     .replace("%5f", "_")
    logging.debug("[ECPay] 🔐 編碼後字串: %s", encoded)
    sha256 = hashlib.sha256()
    sha256.update(encoded.encode("utf-8"))
    return sha256.hexdigest().upper()

def get_amount_bucket(trade_amt_str: str) -> str:
    try:
        amount = int(float(trade_amt_str))  # 支援 "100.0" 也可被分類
    except Exception as e:
        logging.warning("[ECPay] ⚠️ TradeAmt 解析失敗，預設使用 30 區間: %s", trade_amt_str)
        return "30"

    if amount < 75:
        return "30"
    elif amount < 150:
        return "75"
    elif amount < 300:
        return "150"
    elif amount < 750:
        return "300"
    elif amount < 1500:
        return "750"
    else:
        return "1500"


def handle_ecpay_return(form: dict, db):
    logging.info("[ECPay] 收到付款通知表單：%s", form)

    merchant_id = form.get("MerchantID")
    data_encrypted = form.get("Data")
    received_mac = form.get("CheckMacValue")

    logging.debug("[ECPay] MerchantID: %s", merchant_id)
    logging.debug("[ECPay] Data (Encrypted): %s", data_encrypted)
    logging.debug("[ECPay] CheckMacValue (Received): %s", received_mac)

    if merchant_id != MERCHANT_ID:
        logging.error("[ECPay] MerchantID 不符：收到=%s, 預期=%s", merchant_id, MERCHANT_ID)
        raise ValueError("MerchantID 不正確")

    # 解密
    decrypted_json_str, raw_decrypted_str = aes_decrypt(data_encrypted, HASH_KEY, HASH_IV)

    # CheckMacValue 驗證（使用 AES 解密後的原始 URL encoded 字串）
    expected_mac = generate_check_mac_value_for_livestream(
        raw_decrypted_str, HASH_KEY, HASH_IV
    )

    if expected_mac != received_mac:
        logging.warning("[ECPay] CheckMacValue 驗證失敗")
        return "0|FAIL"

    try:
        parsed = json.loads(decrypted_json_str)
        logging.debug("[ECPay] 成功解析 JSON: %s", parsed)
    except Exception as e:
        logging.exception("[ECPay] JSON 解碼失敗")
        return "FAIL", 400

    # 從 OrderInfo 中取出 TradeNo、TradeAmt、PaymentDate
    order_info = parsed.get("OrderInfo", {})
    trade_no = order_info.get("TradeNo")
    trade_amt = order_info.get("TradeAmt", "0")

    # 分類金額區間
    bucket_key = get_amount_bucket(trade_amt)
    logging.info("[ECPay] 分類至金額區間 bucket: %s", bucket_key)

    # 📄 寫入到 `donations_by_amount/{bucket_key}`
    doc_ref = db.collection("donations_by_amount").document(bucket_key)
    try:
        doc_snapshot = doc_ref.get()
        existing = doc_snapshot.to_dict() or {}
        existing_items = existing.get("items", [])

        if any(item.get("OrderInfo", {}).get("TradeNo") == trade_no for item in existing_items):
            logging.info("✅ [ECPay] TradeNo 已存在，跳過寫入: %s", trade_no)
        else:
            new_items = existing_items + [parsed]
            doc_ref.set({
                "items": new_items,
                "updatedAt": datetime.now(timezone.utc),
            })
            logging.info("✅ [ECPay] 寫入 Firestore: donations_by_amount/%s", bucket_key)
    except Exception as e:
        logging.exception("[ECPay] Firestore 寫入失敗")
        return "FAIL", 500

    return "1|OK"
