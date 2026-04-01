"""
WebSub callback route 測試：驗證 GET 驗證、POST 推播寫入、簽名驗證
"""

import hashlib
import hmac
import importlib
from unittest.mock import MagicMock, patch

import pytest
from conftest import create_test_app

SAMPLE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <yt:channelId>UCuAXFkgsw1L7xaCfnd5JJOw</yt:channelId>
    <title>Test Video</title>
  </entry>
</feed>"""


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def websub_app(shared_mock_db):
    # reload 取得乾淨的 blueprint
    import routes.websub_notify_route as mod

    importlib.reload(mod)

    app = create_test_app()
    mod.init_websub_notify_route(app, shared_mock_db)
    return app


@pytest.fixture
def websub_client(websub_app):
    return websub_app.test_client()


class TestWebSubGetVerification:
    """GET /websub-callback 驗證訂閱"""

    def test_returns_challenge(self, websub_client):
        resp = websub_client.get(
            "/websub-callback?hub.mode=subscribe&hub.challenge=abc123&hub.topic=test"
        )
        assert resp.status_code == 200
        assert resp.data == b"abc123"

    def test_missing_challenge_returns_400(self, websub_client):
        resp = websub_client.get("/websub-callback?hub.mode=subscribe")
        assert resp.status_code == 400


class TestWebSubPostNotification:
    """POST /websub-callback 推播處理"""

    def test_valid_xml_writes_to_firestore(self, websub_client, shared_mock_db):
        resp = websub_client.post(
            "/websub-callback",
            data=SAMPLE_XML,
            content_type="application/atom+xml",
        )
        assert resp.status_code == 204

        # 驗證寫入新 collection（直接 doc.set，不再用 transaction）
        shared_mock_db.collection.assert_called_with("live_redirect_notifications")
        doc_mock = shared_mock_db.collection.return_value.document.return_value
        doc_mock.set.assert_called()

        # 驗證 doc ID 格式為 {date}_{videoId}
        doc_id = shared_mock_db.collection.return_value.document.call_args[0][0]
        assert "dQw4w9WgXcQ" in doc_id
        assert "_" in doc_id

    def test_invalid_signature_returns_403(self, websub_client):
        """設定 WEBSUB_SECRET 後，錯誤簽名應被拒絕"""
        with patch.dict("os.environ", {"WEBSUB_SECRET": "my-secret"}):
            resp = websub_client.post(
                "/websub-callback",
                data=SAMPLE_XML,
                content_type="application/atom+xml",
                headers={"X-Hub-Signature": "sha1=wrong"},
            )
            assert resp.status_code == 403

    def test_valid_signature_passes(self, websub_client, shared_mock_db):
        with patch.dict("os.environ", {"WEBSUB_SECRET": "my-secret"}):
            xml_bytes = SAMPLE_XML.encode()
            sig = "sha1=" + hmac.new(b"my-secret", xml_bytes, hashlib.sha1).hexdigest()

            resp = websub_client.post(
                "/websub-callback",
                data=xml_bytes,
                content_type="application/atom+xml",
                headers={"X-Hub-Signature": sig},
            )
            assert resp.status_code == 204
