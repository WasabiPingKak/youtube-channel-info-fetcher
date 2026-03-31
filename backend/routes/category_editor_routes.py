"""
Category Editor − 讀取編輯器初始化資料
--------------------------------------
GET /api/categories/editor-data?channel_id={ID}

回傳：
{
  "config": { ... },
  "videos": [ ... ],
  "removedSuggestedKeywords": [ ... ]
}
"""

import logging
from typing import Any

from apiflask import APIBlueprint
from flask import jsonify, request
from google.api_core.exceptions import GoogleAPIError

# 服務層：讀取分類設定
from services.firestore_settings_service import load_category_settings
from utils.auth_decorator import require_auth
from utils.channel_validator import is_valid_channel_id
from utils.error_response import error_response

category_editor_bp = APIBlueprint("category_editor", __name__, tag="Category Editor")


def _serialize_timestamp(ts: Any) -> str:
    """將 Firestore Timestamp / datetime 轉為 ISO 8601 字串（UTC）。"""
    if ts is None:
        return None
    if hasattr(ts, "isoformat"):
        return ts.isoformat()
    return str(ts)


def _normalize_type(raw: Any) -> str:
    """將 Firestore 存的中文 type 正規化為 'live' | 'videos' | 'shorts'。"""
    if isinstance(raw, str):
        if "直播" in raw:
            return "live"
        if "影片" in raw:
            return "videos"
        if "short" in raw.lower():
            return "shorts"
    return "unknown"


def init_category_editor_routes(app, db):
    """註冊 category editor 相關 API 路由到 app。"""

    @category_editor_bp.route("/api/categories/editor-data", methods=["GET"])
    @category_editor_bp.doc(
        summary="取得分類編輯器資料",
        description="一次取得 settings/config 與所有影片文件",
        security="CookieAuth",
    )
    @require_auth(db)
    def get_editor_data(auth_channel_id=None):
        channel_id = request.args.get("channel_id")
        if not channel_id:
            logging.warning("⚠️ 缺少 channel_id 參數")
            return jsonify({"error": "channel_id is required"}), 400
        if not is_valid_channel_id(channel_id):
            logging.warning(f"⚠️ channel_id 格式不合法：{channel_id}")
            return jsonify({"error": "channel_id 格式不合法"}), 400

        if channel_id != auth_channel_id:
            logging.warning(
                f"⛔ 嘗試讀取他人頻道編輯資料：JWT={auth_channel_id}, 請求={channel_id}"
            )
            return jsonify({"error": "無權限存取此頻道"}), 403

        try:
            logging.info(f"🚀 開始讀取編輯器資料 for channel_id={channel_id}")

            # 1. 讀取分類設定
            config = load_category_settings(db, channel_id) or {}
            logging.info(f"✅ config 載入成功，欄位數：{len(config)}")
            if not config:
                logging.warning("⚠️ 該頻道尚未建立 config 文件")

            # 2. 讀取影片清單
            videos_coll = db.collection("channel_data").document(channel_id).collection("videos")
            docs = list(videos_coll.stream())
            logging.info(f"📦 讀取 Firestore 影片文件數量：{len(docs)}")

            videos: list[dict[str, Any]] = []
            for i, doc in enumerate(docs):
                data = doc.to_dict() or {}
                logging.debug(f"🔍 處理影片 {i + 1}：{data.get('title', '無標題')}")

                video_item = {
                    "videoId": data.get("videoId", doc.id),
                    "title": data.get("title"),
                    "publishDate": _serialize_timestamp(data.get("publishDate")),
                    "duration": data.get("duration"),
                    "type": _normalize_type(data.get("type")),
                    "matchedCategories": data.get("matchedCategories", []),
                    "game": data.get("game"),
                }

                if not data.get("type"):
                    logging.warning(f"⚠️ 影片 {doc.id} 缺少 type 欄位")
                if not data.get("title"):
                    logging.warning(f"⚠️ 影片 {doc.id} 缺少 title")
                if not data.get("publishDate"):
                    logging.warning(f"⚠️ 影片 {doc.id} 缺少 publishDate")

                videos.append(video_item)

            if not videos:
                logging.warning("⚠️ 該頻道目前影片為空，或全部無法解析")

            return jsonify(
                {
                    "config": config,
                    "videos": videos,
                    "removedSuggestedKeywords": config.get("removedSuggestedKeywords", []),
                }
            ), 200

        except GoogleAPIError:
            logging.exception("🔥 Firestore 操作失敗")
            return error_response("Firestore 操作失敗", 500)

        except Exception:
            logging.exception("🔥 無法取得 editor-data")
            return error_response("伺服器內部錯誤", 500)

    app.register_blueprint(category_editor_bp)
