"""
Cloud Tasks client 測試：任務派發與錯誤處理
"""

from unittest.mock import MagicMock, patch


class TestDispatchTask:
    """dispatch_task 單一任務派發"""

    @patch.dict(
        "os.environ",
        {
            "GOOGLE_CLOUD_PROJECT": "test-project",
            "CLOUD_RUN_SERVICE_URL": "https://test.run.app",
            "ADMIN_API_KEY": "test-key",
        },
    )
    def test_dispatches_task_successfully(self):
        import importlib

        import utils.cloud_tasks_client as mod

        # mock 整個 CloudTasksClient class
        mock_client = MagicMock()
        mock_client.queue_path.return_value = "projects/test/locations/asia-east1/queues/q"
        mock_task = MagicMock()
        mock_task.name = "tasks/123"
        mock_client.create_task.return_value = mock_task

        with patch("utils.cloud_tasks_client.tasks_v2.CloudTasksClient", return_value=mock_client):
            mod._client = None  # 重設快取
            importlib.reload(mod)
            result = mod.dispatch_task("/api/test", params={"id": "123"})

        assert result == "tasks/123"
        mock_client.create_task.assert_called_once()

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "", "CLOUD_RUN_SERVICE_URL": ""})
    def test_missing_config_returns_none(self):
        import importlib

        import utils.cloud_tasks_client as mod

        importlib.reload(mod)
        result = mod.dispatch_task("/api/test")
        assert result is None

    @patch.dict(
        "os.environ",
        {
            "GOOGLE_CLOUD_PROJECT": "test-project",
            "CLOUD_RUN_SERVICE_URL": "https://test.run.app",
        },
    )
    def test_create_task_failure_returns_none(self):
        import importlib

        import utils.cloud_tasks_client as mod

        mock_client = MagicMock()
        mock_client.queue_path.return_value = "projects/test/locations/asia-east1/queues/q"
        mock_client.create_task.side_effect = Exception("API error")

        with patch("utils.cloud_tasks_client.tasks_v2.CloudTasksClient", return_value=mock_client):
            mod._client = None
            importlib.reload(mod)
            result = mod.dispatch_task("/api/test")

        assert result is None


class TestDispatchTasksBatch:
    """dispatch_tasks_batch 批次派發"""

    @patch("utils.cloud_tasks_client.dispatch_task")
    def test_batch_counts(self, mock_dispatch):
        from utils.cloud_tasks_client import dispatch_tasks_batch

        mock_dispatch.side_effect = ["task/1", "task/2", None]
        result = dispatch_tasks_batch(
            "/api/test",
            params_list=[{"id": "1"}, {"id": "2"}, {"id": "3"}],
        )
        assert result == {"dispatched": 2, "failed": 1}
