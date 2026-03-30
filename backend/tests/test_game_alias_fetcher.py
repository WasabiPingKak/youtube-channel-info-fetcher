"""
game_alias_fetcher 測試：遊戲別名 API 抓取與快取
"""

import os
import time
from unittest.mock import MagicMock, patch

import pytest

import utils.game_alias_fetcher as mod


@pytest.fixture(autouse=True)
def _reset_cache():
    mod._cache = {}
    mod._last_fetch_time = 0
    yield
    mod._cache = {}
    mod._last_fetch_time = 0


class TestFetchGlobalAliasMap:
    def test_uses_cache_when_valid(self):
        mod._cache = {"Minecraft": ["MC"]}
        mod._last_fetch_time = time.time()
        result = mod.fetch_global_alias_map()
        assert result == {"Minecraft": ["MC"]}

    def test_raises_when_no_endpoint(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("GAME_ALIAS_ENDPOINT", None)
            with pytest.raises(OSError, match="GAME_ALIAS_ENDPOINT"):
                mod.fetch_global_alias_map(force_refresh=True)

    @patch("utils.game_alias_fetcher.requests.get")
    def test_fetches_from_api(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"Apex": ["APEX"]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        with patch.dict(os.environ, {"GAME_ALIAS_ENDPOINT": "https://example.com/api"}):
            result = mod.fetch_global_alias_map(force_refresh=True)
            assert result == {"Apex": ["APEX"]}
            assert mod._cache == {"Apex": ["APEX"]}

    @patch("utils.game_alias_fetcher.requests.get")
    def test_invalid_format_keeps_old_cache(self, mock_get):
        mod._cache = {"old": ["data"]}
        mock_resp = MagicMock()
        mock_resp.json.return_value = ["not", "a", "dict"]
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        with patch.dict(os.environ, {"GAME_ALIAS_ENDPOINT": "https://example.com/api"}):
            result = mod.fetch_global_alias_map(force_refresh=True)
            assert result == {"old": ["data"]}

    @patch("utils.game_alias_fetcher.requests.get")
    def test_network_error_keeps_old_cache(self, mock_get):
        mod._cache = {"cached": ["value"]}
        mock_get.side_effect = ConnectionError("network down")

        with patch.dict(os.environ, {"GAME_ALIAS_ENDPOINT": "https://example.com/api"}):
            result = mod.fetch_global_alias_map(force_refresh=True)
            assert result == {"cached": ["value"]}
