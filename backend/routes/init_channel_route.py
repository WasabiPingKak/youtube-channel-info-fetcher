from flask import Blueprint, request, jsonify
from google.api_core.exceptions import GoogleAPIError
from services.google_oauth import get_channel_id
from services.firestore.auth_service import get_refresh_token
from services.channel_initializer import run_channel_initialization
from routes.websub_subscribe_route import subscribe_channel_by_id
import logging

def init_channel_route(app):
    bp = Blueprint("init_channel", __name__)

    @bp.route("/api/init-channel", methods=["GET"])
    def init_channel():
        channel_id = request.args.get("channel")
        logging.debug(f"📥 [InitAPI] 收到初始化請求：channel={channel_id}")

        if not channel_id:
            logging.warning("[InitAPI] ⚠️ 未提供 channelId 參數")
            return jsonify({
                "success": False,
                "error": "Missing channelId",
                "code": "MISSING_CHANNEL_ID"
            }), 400

        try:
            token = get_refresh_token(channel_id)
            if not token:
                logging.warning(f"[InitAPI] ⚠️ 該頻道尚未授權：{channel_id}")
                return jsonify({
                    "success": False,
                    "error": "Channel is not authorized",
                    "code": "UNAUTHORIZED"
                }), 401

            logging.info(f"[InitAPI] ✅ 開始執行初始化流程 for {channel_id}")
            run_channel_initialization(channel_id)
            logging.info(f"[InitAPI] 🎉 初始化完成 for {channel_id}")

            if not subscribe_channel_by_id(channel_id):
                logging.warning(f"[InitAPI] ⚠️ WebSub 訂閱失敗 for {channel_id}")

            return jsonify({
                "success": True,
                "channelId": channel_id,
                "message": "初始化完成"
            }), 200

        except GoogleAPIError as e:
            logging.exception(f"[InitAPI] ❌ Firestore 操作失敗 for {channel_id}")
            return jsonify({
                "success": False,
                "error": str(e),
                "code": "FIRESTORE_ERROR"
            }), 500

        except Exception as e:
            logging.exception(f"[InitAPI] ❌ 初始化過程錯誤 for {channel_id}")
            return jsonify({
                "success": False,
                "error": str(e),
                "code": "INTERNAL_ERROR"
            }), 500

    app.register_blueprint(bp)
