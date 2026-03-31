"""utils/error_response.py 的單元測試"""

import json

from flask import Flask

from utils.error_response import error_response


class TestErrorResponse:
    def setup_method(self):
        self.app = Flask(__name__)

    def test_default_status_code_is_500(self):
        with self.app.app_context():
            resp, status = error_response("伺服器內部錯誤")
            assert status == 500
            assert json.loads(resp.data) == {"error": "伺服器內部錯誤"}

    def test_custom_status_code(self):
        with self.app.app_context():
            resp, status = error_response("找不到資源", 404)
            assert status == 404
            assert json.loads(resp.data) == {"error": "找不到資源"}

    def test_400_bad_request(self):
        with self.app.app_context():
            resp, status = error_response("參數錯誤", 400)
            assert status == 400
            data = json.loads(resp.data)
            assert data["error"] == "參數錯誤"
            assert "success" not in data
            assert "message" not in data
            assert "code" not in data
