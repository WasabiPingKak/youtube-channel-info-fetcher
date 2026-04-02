"""
管理員撤銷授權端點測試：POST /api/admin/revoke

使用 Firestore emulator 取代 MagicMock。
"""

import pytest
from conftest import create_test_app, seed_channel_meta

from routes.admin_revoke_route import init_admin_revoke_route
from utils.jwt_util import generate_jwt

# conftest 設定的 admin ID（JWT channelId 不驗格式，admin check 只查 set membership）
ADMIN_ID = "UC_ADMIN_001"
NON_ADMIN_ID = "UC_NOT_ADMIN"
# target_channel_id 經過 Pydantic 驗證，必須符合 UC + 22 字元 = 24 字元
TARGET_ID = "UCtargetChannelXXXXXXXXX"


@pytest.fixture
def app(db):
    app = create_test_app()
    init_admin_revoke_route(app, db)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


class TestAdminRevokeAuth:
    """認證與權限檢查"""

    def test_no_cookie_returns_401(self, client):
        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )
        assert resp.status_code == 401

    def test_non_admin_returns_403(self, db, client):
        """一般使用者嘗試撤銷 → 403"""
        seed_channel_meta(db, NON_ADMIN_ID)

        token = generate_jwt(NON_ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )
        assert resp.status_code == 403
        assert resp.get_json()["error"] == "權限不足"

    def test_invalid_channel_id_format_returns_422(self, db, client):
        """target channel_id 格式不合法 → 422"""
        seed_channel_meta(db, ADMIN_ID)

        token = generate_jwt(ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": "invalid-id"},
        )
        assert resp.status_code == 422


class TestAdminRevokeSuccess:
    """正常撤銷流程"""

    def test_revoke_sets_revoked_at(self, db, client):
        """成功撤銷後，Firestore 應被寫入 revoked_at"""
        seed_channel_meta(db, ADMIN_ID)
        # target 需要已存在 meta doc
        seed_channel_meta(db, TARGET_ID, refresh_token="some_token")

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

        # 從 Firestore 讀回驗證 revoked_at 已寫入
        meta = (
            db.collection("channel_data")
            .document(TARGET_ID)
            .collection("channel_info")
            .document("meta")
            .get()
            .to_dict()
        )
        assert "revoked_at" in meta


class TestAdminRevokeEdgeCases:
    """邊界情況"""

    def test_target_not_found_returns_404(self, db, client):
        """撤銷不存在的頻道 → 404"""
        seed_channel_meta(db, ADMIN_ID)

        token = generate_jwt(ADMIN_ID)
        client.set_cookie("__session", token)

        resp = client.post(
            "/api/admin/revoke",
            json={"target_channel_id": TARGET_ID},
        )

        assert resp.status_code == 404
        assert "找不到" in resp.get_json()["error"]
