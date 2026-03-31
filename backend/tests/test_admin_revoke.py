"""
管理員撤銷授權端點測試：POST /api/admin/revoke
"""

from unittest.mock import MagicMock

from utils.jwt_util import generate_jwt

# conftest 設定的 admin ID（JWT channelId 不驗格式，admin check 只查 set membership）
ADMIN_ID = "UC_ADMIN_001"
NON_ADMIN_ID = "UC_NOT_ADMIN"
# target_channel_id 經過 Pydantic 驗證，必須符合 UC + 22 字元 = 24 字元
TARGET_ID = "UCtargetChannelXXXXXXXXX"


def _make_app(mock_db):
    """建立掛載 admin_revoke_route 的測試 app"""
    from conftest import create_test_app

    from routes.admin_revoke_route import init_admin_revoke_route

    app = create_test_app()
    init_admin_revoke_route(app, mock_db)

    return app


def _mock_meta_doc(mock_db, exists=True):
    """設定 mock Firestore 的 meta document 行為"""
    meta_doc = MagicMock()
    meta_doc.exists = exists
    meta_doc.to_dict.return_value = {}

    mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = meta_doc

    return mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value


class TestAdminRevokeAuth:
    """認證與權限檢查"""

    def test_no_cookie_returns_401(self, mock_db):
        app = _make_app(mock_db)
        client = app.test_client()

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )
        assert resp.status_code == 401

    def test_non_admin_returns_403(self, mock_db):
        """一般使用者嘗試撤銷 → 403"""
        _mock_meta_doc(mock_db)
        app = _make_app(mock_db)
        client = app.test_client()

        token = generate_jwt(NON_ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )
        assert resp.status_code == 403
        assert resp.get_json()["error"] == "權限不足"

    def test_invalid_channel_id_format_returns_422(self, mock_db):
        """target channel_id 格式不合法 → 422"""
        _mock_meta_doc(mock_db)
        app = _make_app(mock_db)
        client = app.test_client()

        token = generate_jwt(ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": "invalid-id"},
        )
        assert resp.status_code == 422


class TestAdminRevokeSuccess:
    """正常撤銷流程"""

    def test_revoke_sets_revoked_at(self, mock_db):
        """成功撤銷後，Firestore 應被寫入 revoked_at"""
        meta_ref = _mock_meta_doc(mock_db, exists=True)
        app = _make_app(mock_db)
        client = app.test_client()

        token = generate_jwt(ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["target_channel_id"] == TARGET_ID

        # 驗證 Firestore update 被呼叫
        meta_ref.update.assert_called_once()
        call_args = meta_ref.update.call_args[0][0]
        assert "revoked_at" in call_args


class TestAdminRevokeEdgeCases:
    """邊界情況"""

    def test_target_not_found_returns_404(self, mock_db):
        """撤銷不存在的頻道 → 404"""
        _mock_meta_doc(mock_db, exists=False)
        app = _make_app(mock_db)
        client = app.test_client()

        token = generate_jwt(ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )

        assert resp.status_code == 404
        assert "找不到" in resp.get_json()["error"]
