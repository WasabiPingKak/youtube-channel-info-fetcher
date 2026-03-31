"""
Donation 路由測試：捐款資料讀取、過濾、日期解析、排序
"""

from unittest.mock import MagicMock

import pytest
from conftest import create_test_app

from routes.donation_route import init_donation_route


@pytest.fixture
def app(mock_db):
    app = create_test_app()
    init_donation_route(app, mock_db)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def _make_doc(items):
    """建立 mock Firestore document"""
    doc = MagicMock()
    doc.to_dict.return_value = {"items": items}
    return doc


def _make_item(name, note, amount, date_str="2024/01/15+12:00:00"):
    return {
        "PatronName": name,
        "PatronNote": note,
        "OrderInfo": {
            "TradeAmt": amount,
            "PaymentDate": date_str,
        },
    }


class TestDonationEmpty:
    """空資料場景"""

    def test_empty_collection_returns_empty_list(self, client, mock_db):
        mock_db.collection.return_value.stream.return_value = []
        resp = client.get("/api/donations")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_no_vtmap_items_returns_empty(self, client, mock_db):
        """沒有包含 vtmap 的 note → 空結果"""
        doc = _make_doc([_make_item("小明", "一般捐款", 100)])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        assert resp.status_code == 200
        assert resp.get_json() == []


class TestDonationFiltering:
    """vtmap 過濾邏輯"""

    def test_vtmap_case_insensitive(self, client, mock_db):
        """PatronNote 包含 VTMap（大寫）也應通過"""
        doc = _make_doc([_make_item("小明", "支持 VTMap 加油", 200)])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["patronName"] == "小明"

    def test_non_string_patron_note_skipped(self, client, mock_db):
        """PatronNote 不是字串 → 跳過"""
        item = {
            "PatronName": "小明",
            "PatronNote": 12345,
            "OrderInfo": {"TradeAmt": 100, "PaymentDate": "2024/01/15+12:00:00"},
        }
        doc = _make_doc([item])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        assert resp.get_json() == []

    def test_non_dict_item_skipped(self, client, mock_db):
        """items 裡混入非 dict 元素 → 跳過"""
        doc = _make_doc(["not_a_dict", _make_item("小華", "vtmap", 50)])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        assert len(resp.get_json()) == 1

    def test_items_not_list_skipped(self, client, mock_db):
        """items 不是 list → 跳過整個 document"""
        doc = MagicMock()
        doc.to_dict.return_value = {"items": "not_a_list"}
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        assert resp.get_json() == []


class TestDonationDateParsing:
    """日期解析與排序"""

    def test_sorted_by_date_descending(self, client, mock_db):
        """結果應按付款日期降序排列"""
        items = [
            _make_item("A", "vtmap", 100, "2024/01/10+08:00:00"),
            _make_item("B", "vtmap", 200, "2024/03/01+12:00:00"),
            _make_item("C", "vtmap", 50, "2024/02/15+10:00:00"),
        ]
        doc = _make_doc(items)
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        data = resp.get_json()
        assert len(data) == 3
        assert data[0]["patronName"] == "B"  # 最新
        assert data[1]["patronName"] == "C"
        assert data[2]["patronName"] == "A"  # 最舊

    def test_invalid_date_format_skipped(self, client, mock_db):
        """日期格式錯誤 → 跳過該筆"""
        items = [
            _make_item("有效", "vtmap", 100, "2024/01/15+12:00:00"),
            _make_item("無效", "vtmap", 50, "bad-date-format"),
        ]
        doc = _make_doc(items)
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["patronName"] == "有效"

    def test_sort_key_removed_from_response(self, client, mock_db):
        """回傳資料不應包含 _sortKey"""
        doc = _make_doc([_make_item("小明", "vtmap", 100)])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        data = resp.get_json()
        assert "_sortKey" not in data[0]


class TestDonationAmountFallback:
    """金額來源 fallback"""

    def test_trade_amt_from_order_info(self, client, mock_db):
        doc = _make_doc([_make_item("小明", "vtmap", 500)])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        assert resp.get_json()[0]["tradeAmt"] == 500

    def test_trade_amt_fallback_to_top_level(self, client, mock_db):
        """OrderInfo.TradeAmt 為 0 時，取最外層 TradeAmt"""
        item = {
            "PatronName": "小華",
            "PatronNote": "vtmap",
            "TradeAmt": 300,
            "OrderInfo": {"TradeAmt": 0, "PaymentDate": "2024/01/15+12:00:00"},
        }
        doc = _make_doc([item])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        assert resp.get_json()[0]["tradeAmt"] == 300

    def test_no_order_info_uses_top_level(self, client, mock_db):
        """OrderInfo 為空 → 使用最外層 TradeAmt"""
        item = {
            "PatronName": "小華",
            "PatronNote": "vtmap",
            "TradeAmt": 250,
            "OrderInfo": {},
        }
        doc = _make_doc([item])
        mock_db.collection.return_value.stream.return_value = [doc]

        resp = client.get("/api/donations")
        # OrderInfo 為空 → payment_date_str="" → 日期解析失敗 → 跳過
        assert resp.get_json() == []


class TestDonationError:
    """錯誤處理"""

    def test_firestore_error_returns_500(self, client, mock_db):
        mock_db.collection.return_value.stream.side_effect = Exception("Firestore down")
        resp = client.get("/api/donations")
        assert resp.status_code == 500
        assert resp.get_json()["error"] == "伺服器內部錯誤"
