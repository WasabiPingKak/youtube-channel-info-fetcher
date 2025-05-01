"""
Category Editor − 讀取編輯器初始化資料
--------------------------------------
GET /api/categories/editor-data?channel_id={ID}

回傳：
{
  "config": { ... },                   # settings/config 全文（若不存在則空物件）
  "videos": [ ... ],                  # 該頻道所有影片文件
  "removedSuggestedKeywords": [ ... ] # 從 config 中額外補上
}
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from flask import jsonify, request
from firebase_admin import firestore

# 服務層：讀取分類設定
from services.firestore_settings_service import load_category_settings, db as fs_db


def _serialize_timestamp(ts: Any) -> str:
    """將 Firestore Timestamp / datetime 轉為 ISO 8601 字串（UTC）。"""
    if ts is None:
        return None
    if hasattr(ts, "isoformat"):
        return ts.isoformat()
    return str(ts)


def init_category_editor_routes(app):
    """註冊 category editor 相關 API 路由到 app。"""

    @app.route("/api/categories/editor-data", methods=["GET"])
    def get_editor_data():
        """一次取得 settings/config 與所有影片文件。"""
        channel_id = request.args.get("channel_id")
        if not channel_id:
            return jsonify({"error": "channel_id is required"}), 400

        try:
            # 1. 讀取分類設定
            config = load_category_settings(channel_id) or {}

            # 2. 讀取影片清單
            videos_coll = (
                fs_db.collection("channel_data")
                .document(channel_id)
                .collection("videos")
            )
            docs = videos_coll.stream()

            videos: List[Dict[str, Any]] = []
            for doc in docs:
                data = doc.to_dict() or {}

                videos.append(
                    {
                        "videoId": data.get("videoId", doc.id),
                        "title": data.get("title"),
                        "publishDate": _serialize_timestamp(data.get("publishDate")),
                        "duration": data.get("duration"),
                        "type": data.get("type"),
                        "matchedCategories": data.get("matchedCategories", []),
                        "game": data.get("game"),
                    }
                )

            return jsonify({
                "config": config,
                "videos": videos,
                "removedSuggestedKeywords": config.get("removedSuggestedKeywords", [])
            }), 200

        except Exception as exc:  # pylint: disable=broad-except
            logging.exception("🔥 無法取得 editor-data")
            return (
                jsonify({
                    "error": "internal_error",
                    "message": str(exc),
                }),
                500,
            )
