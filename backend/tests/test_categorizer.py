"""
categorizer 測試：normalize、tokenize_title、keyword_in_title、match_category_and_game
"""

from utils.categorizer import (
    keyword_in_title,
    match_category_and_game,
    normalize,
    tokenize_title,
)

# ═══════════════════════════════════════════════════════
# normalize
# ═══════════════════════════════════════════════════════


class TestNormalize:
    def test_removes_at_mentions(self):
        assert "@user" not in normalize("Hello @user_123 world")

    def test_lowercase(self):
        assert normalize("HELLO") == "hello"

    def test_removes_spaces(self):
        assert normalize("a b c") == "abc"

    def test_removes_fullwidth_spaces(self):
        assert normalize("a\u3000b") == "ab"

    def test_combined(self):
        result = normalize("@someone HELLO World")
        assert result == "helloworld"


# ═══════════════════════════════════════════════════════
# tokenize_title
# ═══════════════════════════════════════════════════════


class TestTokenizeTitle:
    def test_extracts_english_tokens(self):
        tokens = tokenize_title("Playing Minecraft today")
        assert "minecraft" in tokens
        assert "playing" in tokens
        assert "today" in tokens

    def test_removes_at_mentions(self):
        tokens = tokenize_title("@user Playing game")
        assert "user" not in tokens

    def test_preserves_dots_and_dashes(self):
        tokens = tokenize_title("v1.2.3 and node-js")
        assert "v1.2.3" in tokens
        assert "node-js" in tokens

    def test_ignores_single_char(self):
        """長度 < 2 的 token 不會被擷取"""
        tokens = tokenize_title("a b cd")
        assert "a" not in tokens
        assert "b" not in tokens
        assert "cd" in tokens

    def test_returns_set(self):
        tokens = tokenize_title("hello hello world")
        assert isinstance(tokens, set)

    def test_chinese_not_tokenized(self):
        """中文不會被 tokenize（只有英數）"""
        tokens = tokenize_title("雜談配信 マイクラ minecraft")
        assert "minecraft" in tokens
        # 中文和日文不會出現在 tokens 裡
        assert all(tok.isascii() for tok in tokens)


# ═══════════════════════════════════════════════════════
# keyword_in_title
# ═══════════════════════════════════════════════════════


class TestKeywordInTitle:
    def test_english_keyword_matches_token(self):
        tokens = {"minecraft", "playing"}
        assert keyword_in_title("minecraft", tokens, "Playing Minecraft") is True

    def test_english_keyword_no_match(self):
        tokens = {"valorant"}
        assert keyword_in_title("minecraft", tokens, "Playing Valorant") is False

    def test_cjk_keyword_substring_match(self):
        """中文關鍵字用 substring 比對"""
        tokens = set()
        assert keyword_in_title("雜談", tokens, "今日的雜談配信") is True

    def test_cjk_keyword_no_match(self):
        tokens = set()
        assert keyword_in_title("遊戲", tokens, "今日的雜談配信") is False

    def test_case_insensitive(self):
        tokens = {"minecraft"}
        assert keyword_in_title("Minecraft", tokens, "MINECRAFT stream") is True

    def test_mixed_keyword_uses_substring(self):
        """含有非 [a-z0-9] 字元的 keyword 使用 substring 比對"""
        tokens = set()
        assert keyword_in_title("マイクラ", tokens, "マイクラ配信やるよ") is True

    def test_alphanumeric_keyword_uses_token_match(self):
        """純英數 keyword 用 token set 比對"""
        tokens = {"ff14", "playing"}
        assert keyword_in_title("FF14", tokens, "Playing FF14") is True


# ═══════════════════════════════════════════════════════
# match_category_and_game
# ═══════════════════════════════════════════════════════

SAMPLE_SETTINGS = {
    "live": {
        "雜談": {
            "雜談": ["閒聊", "聊天"],
            "歌回": ["唱歌", "歌枠"],
        },
        "遊戲": {
            "Minecraft": ["mc", "麥塊"],
            "GeoGuessr": ["geoguessr", "地理猜"],
        },
        "其他": {},
    },
    "videos": {
        "雜談": {"雜談": ["閒聊"]},
        "遊戲": {"Minecraft": ["mc"]},
        "其他": {},
    },
}


class TestMatchCategoryAndGame:
    """match_category_and_game 分類核心邏輯"""

    def test_matches_main_category(self):
        result = match_category_and_game("今天來閒聊", "live", SAMPLE_SETTINGS)
        assert "雜談" in result["matchedCategories"]
        assert result["game"] is None

    def test_matches_game_category(self):
        result = match_category_and_game("今天打 mc 生存", "live", SAMPLE_SETTINGS)
        assert "遊戲" in result["matchedCategories"]
        assert result["game"] == "Minecraft"
        assert "mc" in result["matchedKeywords"]

    def test_matches_game_by_name(self):
        """遊戲名稱本身也是比對目標"""
        result = match_category_and_game("GeoGuessr 挑戰", "live", SAMPLE_SETTINGS)
        assert result["game"] == "GeoGuessr"

    def test_no_match_falls_to_other(self):
        """無任何命中 → 自動套用「其他」"""
        result = match_category_and_game("完全無關的標題", "live", SAMPLE_SETTINGS)
        assert result["matchedCategories"] == ["其他"]
        assert result["game"] is None

    def test_no_other_category_returns_empty(self):
        """settings 中沒有「其他」→ 回傳空 categories"""
        settings = {"live": {"雜談": {"雜談": ["閒聊"]}}}
        result = match_category_and_game("無關標題", "live", settings)
        assert result["matchedCategories"] == []

    def test_multiple_main_categories(self):
        """同時命中多個主分類"""
        result = match_category_and_game("今天閒聊唱歌", "live", SAMPLE_SETTINGS)
        assert "雜談" in result["matchedCategories"]

    def test_game_and_main_category(self):
        """同時命中遊戲和主分類"""
        result = match_category_and_game("一邊閒聊一邊打 mc", "live", SAMPLE_SETTINGS)
        assert "雜談" in result["matchedCategories"]
        assert "遊戲" in result["matchedCategories"]
        assert result["game"] == "Minecraft"

    def test_matched_pairs_structure(self):
        """matchedPairs 結構正確"""
        result = match_category_and_game("閒聊配信", "live", SAMPLE_SETTINGS)
        assert len(result["matchedPairs"]) >= 1
        pair = result["matchedPairs"][0]
        assert "main" in pair
        assert "keyword" in pair
        assert "hitKeywords" in pair

    def test_type_map_converts_chinese(self):
        """中文類型名稱正確轉換"""
        result = match_category_and_game("閒聊", "直播檔", SAMPLE_SETTINGS)
        assert "雜談" in result["matchedCategories"]

    def test_type_map_videos(self):
        result = match_category_and_game("閒聊影片", "影片", SAMPLE_SETTINGS)
        assert "雜談" in result["matchedCategories"]

    def test_unknown_type_uses_as_is(self):
        """未知 type → 直接當 key 使用"""
        result = match_category_and_game("test", "unknown_type", SAMPLE_SETTINGS)
        # unknown_type 不在 settings → 無分類
        assert result["matchedCategories"] == []

    def test_non_dict_subcategory_skipped(self):
        """subcategories 不是 dict → 安全跳過"""
        settings = {"live": {"雜談": "not_a_dict", "其他": {}}}
        result = match_category_and_game("任何標題", "live", settings)
        assert result["matchedCategories"] == ["其他"]

    def test_game_break_on_first_match(self):
        """遊戲分類命中第一個就停止"""
        settings = {
            "live": {
                "遊戲": {
                    "Minecraft": ["mc"],
                    "GeoGuessr": ["mc"],  # 同關鍵字但不同遊戲
                },
            }
        }
        result = match_category_and_game("mc 配信", "live", settings)
        assert result["game"] == "Minecraft"  # 第一個命中

    def test_deduplicates_keywords(self):
        """matchedKeywords 去重"""
        settings = {
            "live": {
                "雜談": {
                    "閒聊": ["聊天"],
                    "雜談": ["聊天"],  # 同關鍵字在不同子分類
                },
            }
        }
        result = match_category_and_game("今天聊天", "live", settings)
        assert result["matchedKeywords"].count("聊天") == 1

    def test_exception_returns_default(self):
        """異常時回傳安全預設值"""
        result = match_category_and_game("test", "live", None)  # settings=None 會觸發異常
        assert result["matchedCategories"] == ["其他"]
        assert result["game"] is None
