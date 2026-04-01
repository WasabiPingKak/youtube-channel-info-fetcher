"""
category_counter 測試：分類計數、重複去除、非法輸入跳過
"""

from datetime import datetime

from services.video_analyzer.category_counter import count_category_counts


def _make_video(matched_categories):
    """快速建立帶 matchedCategories 的影片 dict"""
    return {"matchedCategories": matched_categories}


class TestCountCategoryCounts:
    """測試 count_category_counts() 的計數邏輯"""

    def test_empty_list_returns_all_zeros(self):
        result = count_category_counts([])
        assert result["talk"] == 0
        assert result["game"] == 0
        assert result["music"] == 0
        assert result["show"] == 0
        assert result["all"] == 0

    def test_single_category_match(self):
        """單一分類命中 → 對應 key +1, all +1"""
        result = count_category_counts([_make_video(["雜談"])])
        assert result["talk"] == 1
        assert result["all"] == 1
        assert result["game"] == 0

    def test_multiple_categories_one_video(self):
        """同一影片命中多個分類 → 各分類 +1, all 只 +1"""
        result = count_category_counts([_make_video(["雜談", "遊戲"])])
        assert result["talk"] == 1
        assert result["game"] == 1
        assert result["all"] == 1

    def test_duplicate_category_deduplicated(self):
        """同一影片重複出現相同分類 → 只計一次"""
        result = count_category_counts([_make_video(["雜談", "雜談"])])
        assert result["talk"] == 1

    def test_unmapped_category_ignored(self):
        """未定義在 CATEGORY_MAPPING 的分類 → 全部歸零"""
        result = count_category_counts([_make_video(["其他"])])
        assert result["talk"] == 0
        assert result["all"] == 0

    def test_mixed_mapped_and_unmapped(self):
        """混合已知與未知分類 → 只計算已知的"""
        result = count_category_counts([_make_video(["雜談", "其他"])])
        assert result["talk"] == 1
        assert result["all"] == 1

    def test_not_list_skipped(self):
        """matchedCategories 不是 list（字串）→ 整筆跳過"""
        result = count_category_counts([{"matchedCategories": "雜談"}])
        assert result["talk"] == 0
        assert result["all"] == 0

    def test_missing_key_skipped(self):
        """影片沒有 matchedCategories key → 跳過"""
        result = count_category_counts([{"title": "test"}])
        assert result["all"] == 0

    def test_none_value_skipped(self):
        """matchedCategories 為 None → 跳過"""
        result = count_category_counts([{"matchedCategories": None}])
        assert result["all"] == 0

    def test_all_four_categories(self):
        """四種分類各有一部影片 → 各 key 為 1"""
        videos = [
            _make_video(["雜談"]),
            _make_video(["遊戲"]),
            _make_video(["音樂"]),
            _make_video(["節目"]),
        ]
        result = count_category_counts(videos)
        assert result["talk"] == 1
        assert result["game"] == 1
        assert result["music"] == 1
        assert result["show"] == 1
        assert result["all"] == 4

    def test_updated_at_is_iso_format(self):
        """結果包含 updatedAt 且為合法 ISO 格式"""
        result = count_category_counts([])
        assert "updatedAt" in result
        # 能成功解析表示格式正確
        datetime.fromisoformat(result["updatedAt"])
