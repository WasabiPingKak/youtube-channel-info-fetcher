"""
JWT 工具函數測試：簽發、驗證、過期、續期判斷、admin 判斷
"""
import time
import jwt as pyjwt
import pytest
from utils.jwt_util import (
    generate_jwt,
    verify_jwt,
    should_renew,
    is_admin_channel_id,
    JWT_SECRET,
    JWT_ALGORITHM,
)


class TestGenerateAndVerify:
    """generate_jwt 產出的 token 能被 verify_jwt 正確解回"""

    def test_roundtrip(self):
        token = generate_jwt("UC_TEST_123")
        decoded = verify_jwt(token)

        assert decoded is not None
        assert decoded["channelId"] == "UC_TEST_123"

    def test_contains_iat_and_exp(self):
        token = generate_jwt("UC_TEST_123")
        decoded = verify_jwt(token)

        assert "iat" in decoded
        assert "exp" in decoded
        assert decoded["exp"] > decoded["iat"]


class TestVerifyJwt:
    """verify_jwt 對各種異常 token 的防禦"""

    def test_expired_token_returns_none(self):
        """過期 token 必須被拒絕"""
        payload = {
            "channelId": "UC_EXPIRED",
            "iat": 1000000000,
            "exp": 1000000001,  # 2001 年就過期了
        }
        token = pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        assert verify_jwt(token) is None

    def test_garbage_string_returns_none(self):
        """亂字串不能通過驗證"""
        assert verify_jwt("this.is.not.a.jwt") is None

    def test_empty_string_returns_none(self):
        assert verify_jwt("") is None

    def test_wrong_secret_returns_none(self):
        """用不同 secret 簽的 token 不能通過"""
        payload = {"channelId": "UC_WRONG"}
        token = pyjwt.encode(payload, "wrong-secret", algorithm=JWT_ALGORITHM)
        assert verify_jwt(token) is None


class TestShouldRenew:
    """sliding window 續期判斷"""

    def test_renew_when_less_than_30_min(self):
        """剩不到 30 分鐘 → 應該續期"""
        now = time.time()
        decoded = {"exp": now + (29 * 60)}  # 剩 29 分鐘
        assert should_renew(decoded) is True

    def test_no_renew_when_more_than_30_min(self):
        """剩超過 30 分鐘 → 不需續期"""
        now = time.time()
        decoded = {"exp": now + (31 * 60)}  # 剩 31 分鐘
        assert should_renew(decoded) is False

    def test_boundary_just_over_30_min(self):
        """剛超過 30 分鐘 → 不續期"""
        now = time.time()
        decoded = {"exp": now + (30 * 60) + 5}  # 多 5 秒，避免時間精度問題
        assert should_renew(decoded) is False


class TestIsAdminChannelId:
    """admin allowlist 判斷（conftest 設了 UC_ADMIN_001, UC_ADMIN_002）"""

    def test_admin_in_list(self):
        assert is_admin_channel_id("UC_ADMIN_001") is True
        assert is_admin_channel_id("UC_ADMIN_002") is True

    def test_non_admin(self):
        assert is_admin_channel_id("UC_RANDOM_USER") is False

    def test_empty_string(self):
        assert is_admin_channel_id("") is False

    def test_none(self):
        assert is_admin_channel_id(None) is False
