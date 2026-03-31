import logging

from apiflask import APIBlueprint
from flask import jsonify

from routes.websub_subscribe_route import subscribe_channel_by_id
from schemas.common import InitChannelQuery
from services.channel_initializer import run_channel_initialization
from services.firestore.auth_service import get_refresh_token
from utils.error_response import error_response
from utils.rate_limiter import limiter


def init_channel_route(app, db):
    bp = APIBlueprint("init_channel", __name__, tag="Channel")

    @bp.route("/api/init-channel", methods=["GET"])
    @bp.doc(summary="初始化頻道", description="執行頻道初始化流程，包含影片同步與 WebSub 訂閱")
    @limiter.limit("5 per minute")
    @bp.input(InitChannelQuery, location="query", arg_name="query")
    def init_channel(query):
        channel_id = query.channel
        logging.debug(f"📥 [InitAPI] 收到初始化請求：channel={channel_id}")

        token = get_refresh_token(db, channel_id)
        if not token:
            logging.warning(f"[InitAPI] ⚠️ 該頻道尚未授權：{channel_id}")
            return error_response("Channel is not authorized", 401)

        logging.info(f"[InitAPI] ✅ 開始執行初始化流程 for {channel_id}")
        run_channel_initialization(db, channel_id)
        logging.info(f"[InitAPI] 🎉 初始化完成 for {channel_id}")

        if not subscribe_channel_by_id(channel_id):
            logging.warning(f"[InitAPI] ⚠️ WebSub 訂閱失敗 for {channel_id}")

        return jsonify({"success": True, "channelId": channel_id, "message": "初始化完成"}), 200

    app.register_blueprint(bp)
