"""
get_admin_channel_ids 單元測試：環境變數解析、邊界值、空值處理
"""

import pytest

from utils.admin_ids import get_admin_channel_ids


class TestGetAdminChannelIds:
    """測試從 ADMIN_CHANNEL_IDS 環境變數解析出 admin ID set"""

    @pytest.mark.parametrize(
        "env_val, expected",
        [
            ("UC001,UC002", {"UC001", "UC002"}),
            (" UC001 , UC002 ", {"UC001", "UC002"}),
            ("UC001", {"UC001"}),
            ("UC001,UC002,", {"UC001", "UC002"}),
            (",UC001", {"UC001"}),
            ("UC001,,UC002", {"UC001", "UC002"}),
            (",,,", set()),
            ("  ,  ,  ", set()),
            ("", set()),
        ],
        ids=[
            "正常逗號分隔",
            "含前後空白",
            "單一 ID",
            "尾逗號",
            "頭逗號",
            "連續逗號",
            "純逗號",
            "純空白逗號",
            "空字串",
        ],
    )
    def test_various_formats(self, monkeypatch, env_val, expected):
        monkeypatch.setenv("ADMIN_CHANNEL_IDS", env_val)
        assert get_admin_channel_ids() == expected

    def test_env_not_set_returns_empty(self, monkeypatch):
        """環境變數完全不存在 → 空 set"""
        monkeypatch.delenv("ADMIN_CHANNEL_IDS", raising=False)
        assert get_admin_channel_ids() == set()

    def test_return_type_is_set(self, monkeypatch):
        monkeypatch.setenv("ADMIN_CHANNEL_IDS", "UC001")
        result = get_admin_channel_ids()
        assert isinstance(result, set)
