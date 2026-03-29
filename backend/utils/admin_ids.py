# utils/admin_ids.py
# 統一讀取 ADMIN_CHANNEL_IDS 環境變數，避免多處重複定義

import os


def get_admin_channel_ids() -> set[str]:
    """從環境變數取得 admin channel ID 清單（逗號分隔）"""
    raw = os.getenv("ADMIN_CHANNEL_IDS", "")
    return {cid.strip() for cid in raw.split(",") if cid.strip()}
