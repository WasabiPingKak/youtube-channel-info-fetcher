"""
settings_main_merger 測試：default config 合併、關鍵字去重、遊戲設定保留
"""

from unittest.mock import MagicMock

from utils.settings_main_merger import merge_main_categories_with_user_config


def _mock_db_with_defaults(default_config):
    """建立回傳指定 default config 的 mock db"""
    db = MagicMock()
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = default_config
    db.collection.return_value.document.return_value.get.return_value = doc
    return db


def _mock_db_no_defaults():
    """建立找不到 default config 的 mock db"""
    db = MagicMock()
    doc = MagicMock()
    doc.exists = False
    db.collection.return_value.document.return_value.get.return_value = doc
    return db


class TestMergeMainNoDefaults:
    """找不到 default_categories_config_v2"""

    def test_returns_settings_unchanged(self):
        db = _mock_db_no_defaults()
        settings = {"雜談": {"閒聊": ["聊天"]}}
        result = merge_main_categories_with_user_config(db, settings)
        assert result == settings


class TestMergeMainBasic:
    """基本合併邏輯"""

    def test_default_config_applied_to_all_types(self):
        """default config 應複製到 live/videos/shorts"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": ["聊天"]}})
        settings = {}
        result = merge_main_categories_with_user_config(db, settings)

        for vtype in ("live", "videos", "shorts"):
            assert vtype in result
            assert "雜談" in result[vtype]
            assert "閒聊" in result[vtype]["雜談"]
            assert result[vtype]["雜談"]["閒聊"] == ["聊天"]

    def test_user_keywords_merged_with_defaults(self):
        """使用者關鍵字與 default 合併"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": ["聊天"]}})
        settings = {"雜談": {"閒聊": ["閒聊配信"]}}
        result = merge_main_categories_with_user_config(db, settings)

        keywords = result["live"]["雜談"]["閒聊"]
        assert "聊天" in keywords
        assert "閒聊配信" in keywords

    def test_user_new_subcategory_added(self):
        """使用者新增 default 沒有的子分類"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": ["聊天"]}})
        settings = {"雜談": {"歌回": ["唱歌"]}}
        result = merge_main_categories_with_user_config(db, settings)

        assert "歌回" in result["live"]["雜談"]
        assert result["live"]["雜談"]["歌回"] == ["唱歌"]

    def test_user_new_main_category_added(self):
        """使用者新增 default 沒有的主分類"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}})
        settings = {"音樂": {"歌回": ["唱歌"]}}
        result = merge_main_categories_with_user_config(db, settings)

        assert "音樂" in result["live"]


class TestMergeMainDedup:
    """去重與清理"""

    def test_duplicate_keywords_removed(self):
        """重複關鍵字去重"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": ["聊天", "talk"]}})
        settings = {"雜談": {"閒聊": ["聊天", "新詞"]}}  # 聊天 重複
        result = merge_main_categories_with_user_config(db, settings)

        keywords = result["live"]["雜談"]["閒聊"]
        assert keywords.count("聊天") == 1
        assert "新詞" in keywords

    def test_keyword_same_as_subname_removed(self):
        """使用者合併時，關鍵字與子分類名稱相同 → 移除"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": ["聊天"]}})
        # 使用者新增的關鍵字包含子分類名稱本身
        settings = {"雜談": {"閒聊": ["閒聊", "talk"]}}
        result = merge_main_categories_with_user_config(db, settings)

        keywords = result["live"]["雜談"]["閒聊"]
        assert "閒聊" not in keywords  # 與 sub_name 相同，應被移除
        assert "聊天" in keywords
        assert "talk" in keywords

    def test_flat_keys_cleaned_up(self):
        """合併後扁平主分類 key 應從 settings 清除"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}})
        settings = {"雜談": {"閒聊": ["test"]}}
        result = merge_main_categories_with_user_config(db, settings)

        # 只應有 live/videos/shorts，不應有扁平 key
        assert set(result.keys()) == {"live", "videos", "shorts"}


class TestMergeMainGamePreservation:
    """遊戲設定保留"""

    def test_game_from_video_type_preserved(self):
        """video type 層級的遊戲設定保留"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}})
        settings = {
            "live": {"遊戲": {"Minecraft": ["mc"]}},
        }
        result = merge_main_categories_with_user_config(db, settings)
        assert result["live"]["遊戲"] == {"Minecraft": ["mc"]}

    def test_game_from_top_level_moved(self):
        """最外層遊戲設定搬到各 video type"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}})
        settings = {"遊戲": {"Minecraft": ["mc"]}}
        result = merge_main_categories_with_user_config(db, settings)

        # 每個 type 都應有遊戲設定
        for vtype in ("live", "videos", "shorts"):
            assert result[vtype]["遊戲"] == {"Minecraft": ["mc"]}

    def test_no_game_gets_empty_dict(self):
        """無遊戲設定 → 自動補空"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}})
        settings = {}
        result = merge_main_categories_with_user_config(db, settings)

        for vtype in ("live", "videos", "shorts"):
            assert result[vtype]["遊戲"] == {}


class TestMergeMainEdgeCases:
    """邊界情況"""

    def test_non_dict_default_skipped(self):
        """default config 中非 dict 值 → 跳過"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}, "bad_key": "not_a_dict"})
        settings = {}
        result = merge_main_categories_with_user_config(db, settings)
        assert "bad_key" not in result.get("live", {})

    def test_non_dict_user_config_skipped(self):
        """使用者設定中非 dict 值 → 跳過"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": []}})
        settings = {"雜談": "not_a_dict"}
        result = merge_main_categories_with_user_config(db, settings)
        # 不應因此 crash
        assert "live" in result

    def test_non_list_user_keywords_skipped(self):
        """使用者關鍵字不是 list → 跳過"""
        db = _mock_db_with_defaults({"雜談": {"閒聊": ["聊天"]}})
        settings = {"雜談": {"閒聊": "not_a_list"}}
        result = merge_main_categories_with_user_config(db, settings)
        # 只保留 default 的
        assert result["live"]["雜談"]["閒聊"] == ["聊天"]

    def test_exception_returns_settings(self):
        """異常時回傳原始 settings"""
        db = MagicMock()
        db.collection.side_effect = Exception("Firestore error")
        settings = {"key": "value"}
        result = merge_main_categories_with_user_config(db, settings)
        assert result == settings
