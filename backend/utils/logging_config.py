"""JSON Structured Logging 設定。

Cloud Run 會自動解析 stdout 的 JSON log，對應到 Cloud Logging 的結構化欄位。
本地開發時仍保留可讀的純文字格式。
"""

import logging
import os

from pythonjsonlogger.json import JsonFormatter

# Cloud Logging 使用的 severity 名稱（與 Python level 不同）
_CLOUD_SEVERITY = {
    "DEBUG": "DEBUG",
    "INFO": "INFO",
    "WARNING": "WARNING",
    "ERROR": "ERROR",
    "CRITICAL": "CRITICAL",
}


class CloudJsonFormatter(JsonFormatter):
    """產生 Cloud Logging 相容的 JSON 格式。

    輸出欄位：
    - severity: Cloud Logging 等級
    - message: 日誌訊息
    - logger: logger 名稱
    - request_id: 請求 ID（來自 Flask g.request_id）
    """

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["severity"] = _CLOUD_SEVERITY.get(record.levelname, "DEFAULT")
        log_record["logger"] = record.name
        log_record["request_id"] = getattr(record, "request_id", "-")
        # 移除 python-json-logger 預設塞入但 Cloud Logging 不需要的欄位
        log_record.pop("levelname", None)
        log_record.pop("name", None)
        log_record.pop("taskName", None)


def setup_logging():
    """根據環境設定 root logger：Cloud Run 用 JSON，本地用純文字。"""
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # 清除既有 handler（避免重複）
    root.handlers.clear()

    handler = logging.StreamHandler()

    if os.getenv("K_SERVICE"):
        # Cloud Run 環境 — JSON 輸出
        formatter = CloudJsonFormatter(
            fmt="%(message)s",
            rename_fields={"message": "message"},
        )
    else:
        # 本地開發 — 保留可讀格式
        formatter = logging.Formatter(
            "%(asctime)s %(levelname)s [%(name)s] [request_id=%(request_id)s] %(message)s"
        )

    handler.setFormatter(formatter)
    root.addHandler(handler)
