"""
Cloud Tasks client 測試：任務派發與錯誤處理
"""

from unittest.mock import MagicMock, patch


class TestDispatchTask:
    """dispatch_task 單一任務派發"""

    @patch(
        "utils.cloud_tasks_client._get_config",
        return_value={
            "project_id": "test-project",
            "location": "asia-east1",
            "queue_name": "websub-subscribe",
            "service_url": "https://test.run.app",
        },
    )
    @patch.dict("os.environ", {"ADMIN_API_KEY": "test-key"})
    def test_dispatches_task_successfully(self, _mock_config):
        from utils.cloud_tasks_client import dispatch_task

        mock_client = MagicMock()
        mock_client.queue_path.return_value = "projects/test/locations/asia-east1/queues/q"
        mock_task = MagicMock()
        mock_task.name = "tasks/123"
        mock_client.create_task.return_value = mock_task

        with patch("utils.cloud_tasks_client._get_client", return_value=mock_client):
            result = dispatch_task("/api/test", params={"id": "123"})

        assert result == "tasks/123"
        mock_client.create_task.assert_called_once()

    @patch(
        "utils.cloud_tasks_client._get_config",
        return_value={
            "project_id": "",
            "location": "asia-east1",
            "queue_name": "websub-subscribe",
            "service_url": "",
        },
    )
    def test_missing_config_returns_none(self, _mock_config):
        from utils.cloud_tasks_client import dispatch_task

        result = dispatch_task("/api/test")
        assert result is None

    @patch(
        "utils.cloud_tasks_client._get_config",
        return_value={
            "project_id": "test-project",
            "location": "asia-east1",
            "queue_name": "websub-subscribe",
            "service_url": "https://test.run.app",
        },
    )
    def test_create_task_failure_returns_none(self, _mock_config):
        from utils.cloud_tasks_client import dispatch_task

        mock_client = MagicMock()
        mock_client.queue_path.return_value = "projects/test/locations/asia-east1/queues/q"
        mock_client.create_task.side_effect = Exception("API error")

        with patch("utils.cloud_tasks_client._get_client", return_value=mock_client):
            result = dispatch_task("/api/test")

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

    @patch("utils.cloud_tasks_client.dispatch_task")
    def test_batch_empty_list(self, mock_dispatch):
        from utils.cloud_tasks_client import dispatch_tasks_batch

        result = dispatch_tasks_batch("/api/test", params_list=[])
        assert result == {"dispatched": 0, "failed": 0}
        mock_dispatch.assert_not_called()

    @patch("utils.cloud_tasks_client.dispatch_task")
    def test_batch_all_fail(self, mock_dispatch):
        from utils.cloud_tasks_client import dispatch_tasks_batch

        mock_dispatch.return_value = None
        result = dispatch_tasks_batch(
            "/api/test",
            params_list=[{"id": "1"}, {"id": "2"}],
        )
        assert result == {"dispatched": 0, "failed": 2}

    @patch("utils.cloud_tasks_client.dispatch_task")
    def test_batch_handles_exception_in_future(self, mock_dispatch):
        from utils.cloud_tasks_client import dispatch_tasks_batch

        mock_dispatch.side_effect = Exception("unexpected error")
        result = dispatch_tasks_batch(
            "/api/test",
            params_list=[{"id": "1"}],
        )
        assert result == {"dispatched": 0, "failed": 1}

    @patch("utils.cloud_tasks_client.dispatch_task")
    def test_batch_with_custom_max_workers(self, mock_dispatch):
        from utils.cloud_tasks_client import dispatch_tasks_batch

        mock_dispatch.return_value = "task/1"
        result = dispatch_tasks_batch(
            "/api/test",
            params_list=[{"id": "1"}, {"id": "2"}],
            max_workers=1,
        )
        assert result == {"dispatched": 2, "failed": 0}
