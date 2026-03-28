"""
settings_game_merger 測試：遊戲別名合併、去重、fallback
"""

from unittest.mock import patch

from utils.settings_game_merger import merge_game_categories_with_aliases


def _base_settings():
    """建立基礎 settings 結構"""
    return {
        "live": {"遊戲": {}},
        "videos": {"遊戲": {}},
        "shorts": {"遊戲": {}},
    }


class TestGameMergerBasic:
    """基本合併邏輯"""

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_global_aliases_applied(self, mock_fetch):
        mock_fetch.return_value = {"Minecraft": ["mc", "麥塊"]}
        settings = _base_settings()

        result = merge_game_categories_with_aliases(settings)

        for vtype in ("live", "videos", "shorts"):
            assert "Minecraft" in result[vtype]["遊戲"]
            assert "mc" in result[vtype]["遊戲"]["Minecraft"]
            assert "麥塊" in result[vtype]["遊戲"]["Minecraft"]

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_user_keywords_merged_with_global(self, mock_fetch):
        """使用者關鍵字與 global alias 合併"""
        mock_fetch.return_value = {"Minecraft": ["mc"]}
        settings = _base_settings()
        settings["live"]["遊戲"] = {"Minecraft": ["麥塊"]}

        result = merge_game_categories_with_aliases(settings)

        keywords = result["live"]["遊戲"]["Minecraft"]
        assert "mc" in keywords
        assert "麥塊" in keywords

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_user_only_game_preserved(self, mock_fetch):
        """使用者新增但 global 沒有的遊戲保留"""
        mock_fetch.return_value = {"Minecraft": ["mc"]}
        settings = _base_settings()
        settings["live"]["遊戲"] = {"原神": ["genshin"]}

        result = merge_game_categories_with_aliases(settings)

        assert "原神" in result["live"]["遊戲"]
        assert result["live"]["遊戲"]["原神"] == ["genshin"]
        assert "Minecraft" in result["live"]["遊戲"]  # global 也在

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_empty_global_alias_map(self, mock_fetch):
        """global alias 為空 → 只保留使用者設定"""
        mock_fetch.return_value = {}
        settings = _base_settings()
        settings["live"]["遊戲"] = {"原神": ["genshin"]}

        result = merge_game_categories_with_aliases(settings)
        assert result["live"]["遊戲"] == {"原神": ["genshin"]}


class TestGameMergerDedup:
    """去重"""

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_duplicate_keywords_removed(self, mock_fetch):
        mock_fetch.return_value = {"Minecraft": ["mc", "麥塊"]}
        settings = _base_settings()
        settings["live"]["遊戲"] = {"Minecraft": ["mc", "我的世界"]}  # mc 重複

        result = merge_game_categories_with_aliases(settings)

        keywords = result["live"]["遊戲"]["Minecraft"]
        assert keywords.count("mc") == 1
        assert "我的世界" in keywords
        assert "麥塊" in keywords


class TestGameMergerEdgeCases:
    """邊界情況"""

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_non_dict_user_game_config_reset(self, mock_fetch):
        """使用者遊戲設定非 dict → 重設為空"""
        mock_fetch.return_value = {"Minecraft": ["mc"]}
        settings = _base_settings()
        settings["live"]["遊戲"] = "not_a_dict"

        result = merge_game_categories_with_aliases(settings)
        assert "Minecraft" in result["live"]["遊戲"]

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_non_list_user_keywords_treated_as_empty(self, mock_fetch):
        """使用者關鍵字非 list → 視為空"""
        mock_fetch.return_value = {"Minecraft": ["mc"]}
        settings = _base_settings()
        settings["live"]["遊戲"] = {"Minecraft": "not_a_list"}

        result = merge_game_categories_with_aliases(settings)
        # 只有 global 的 keyword
        assert result["live"]["遊戲"]["Minecraft"] == ["mc"]

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_fetch_failure_returns_settings_unchanged(self, mock_fetch):
        """fetch_global_alias_map 失敗 → 回傳原始 settings"""
        mock_fetch.side_effect = Exception("Network error")
        settings = _base_settings()
        settings["live"]["遊戲"] = {"原神": ["genshin"]}

        result = merge_game_categories_with_aliases(settings)
        assert result["live"]["遊戲"] == {"原神": ["genshin"]}

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_all_three_types_processed(self, mock_fetch):
        """live/videos/shorts 三種類型都處理"""
        mock_fetch.return_value = {"Minecraft": ["mc"]}
        settings = _base_settings()

        result = merge_game_categories_with_aliases(settings)

        for vtype in ("live", "videos", "shorts"):
            assert "Minecraft" in result[vtype]["遊戲"]

    @patch("utils.settings_game_merger.fetch_global_alias_map", create=True)
    def test_does_not_mutate_original(self, mock_fetch):
        """不修改原始 settings 的頂層引用"""
        mock_fetch.return_value = {"Minecraft": ["mc"]}
        settings = _base_settings()
        original_id = id(settings)

        result = merge_game_categories_with_aliases(settings)
        assert id(result) != original_id  # settings.copy() 產生新物件
