"""services/video_check_update_service.py 的單元測試"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

from services.video_check_update_service import check_channel_update_status


class TestCheckChannelUpdateStatus:
    def setup_method(self):
        self.db = MagicMock()
        self.channel_id = "UC_test_channel"
        self.index_ref = MagicMock()
        self.db.collection.return_value.document.return_value = self.index_ref

    def test_no_existing_index_creates_new_and_returns_should_update(self):
        """index_list 不存在時，建立新紀錄並回傳 shouldUpdate=True"""
        doc = MagicMock()
        doc.exists = False
        self.index_ref.get.return_value = doc

        # Mock token 寫入
        token_ref = MagicMock()
        self.db.document.return_value = token_ref

        result = check_channel_update_status(self.db, self.channel_id)

        assert result["shouldUpdate"] is True
        assert result["channelId"] == self.channel_id
        assert "updateToken" in result
        self.index_ref.set.assert_called_once()

    def test_existing_channel_within_12h_no_update(self):
        """頻道在 12 小時內已檢查過，不需更新"""
        recent_time = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
        doc = MagicMock()
        doc.exists = True
        doc.to_dict.return_value = {
            "channels": [
                {
                    "channel_id": self.channel_id,
                    "lastCheckedAt": recent_time,
                    "lastVideoSyncAt": "2025-01-01T00:00:00+00:00",
                }
            ]
        }
        self.index_ref.get.return_value = doc

        result = check_channel_update_status(self.db, self.channel_id)

        assert result["shouldUpdate"] is False
        assert "updateToken" not in result

    def test_existing_channel_past_12h_needs_update(self):
        """頻道超過 12 小時未檢查，需要更新"""
        old_time = (datetime.now(UTC) - timedelta(hours=13)).isoformat()
        doc = MagicMock()
        doc.exists = True
        doc.to_dict.return_value = {
            "channels": [
                {
                    "channel_id": self.channel_id,
                    "lastCheckedAt": old_time,
                }
            ]
        }
        self.index_ref.get.return_value = doc

        token_ref = MagicMock()
        self.db.document.return_value = token_ref

        result = check_channel_update_status(self.db, self.channel_id)

        assert result["shouldUpdate"] is True
        assert "updateToken" in result

    def test_channel_not_in_list_gets_added(self):
        """頻道不在 index_list 中，新增後回傳 shouldUpdate=True"""
        doc = MagicMock()
        doc.exists = True
        doc.to_dict.return_value = {
            "channels": [{"channel_id": "UC_other", "lastCheckedAt": "2025-01-01T00:00:00+00:00"}]
        }
        self.index_ref.get.return_value = doc

        token_ref = MagicMock()
        self.db.document.return_value = token_ref

        result = check_channel_update_status(self.db, self.channel_id)

        assert result["shouldUpdate"] is True
        assert result["channelId"] == self.channel_id

    @patch("services.video_check_update_service.secrets.token_urlsafe", return_value="mock-token")
    def test_update_token_written_to_firestore(self, _mock_token):
        """shouldUpdate 時會將 token 寫入 Firestore"""
        doc = MagicMock()
        doc.exists = False
        self.index_ref.get.return_value = doc

        token_ref = MagicMock()
        self.db.document.return_value = token_ref

        result = check_channel_update_status(self.db, self.channel_id)

        assert result["updateToken"] == "mock-token"
        token_ref.set.assert_called_once()
        written = token_ref.set.call_args[0][0]
        assert written["token"] == "mock-token"
        assert "expiresAt" in written
