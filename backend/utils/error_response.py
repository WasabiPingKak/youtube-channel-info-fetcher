"""統一的 API 錯誤回應格式"""

from flask import jsonify


def error_response(message: str, status_code: int = 500):
    """回傳統一格式的錯誤 JSON 回應。

    格式：{"error": "<message>"}，搭配正確的 HTTP 狀態碼。
    """
    return jsonify({"error": message}), status_code
