"""Request ID 工具 — 集中管理 request ID 的讀取與 outbound header 注入。"""

from flask import g


def get_request_id() -> str:
    """安全取得當前 request 的 request_id，無 context 時回傳 '-'。"""
    try:
        return g.request_id  # type: ignore[no-any-return]
    except (AttributeError, RuntimeError):
        return "-"
