# routes/channel_index_route.py

import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.api_core.exceptions import GoogleAPIError

from services.channel_index_service import get_all_enabled_channels_data
from utils.error_response import error_response


def init_channel_index_route(app, db):
    bp = APIBlueprint("channel_index_route", __name__, tag="Channel")

    @bp.route("/api/channels/index", methods=["GET"])
    @bp.doc(
        summary="取得頻道索引",
        description="回傳所有啟用頻道清單、新加入頻道、以及總註冊數",
    )
    def get_all_enabled_channels():
        try:
            data = get_all_enabled_channels_data(db)
            return jsonify({"success": True, **data})

        except GoogleAPIError:
            logging.exception("❌ Firestore 操作失敗")
            return error_response("Firestore 操作失敗", 500)

        except Exception:
            logging.exception("❌ 無法讀取頻道索引")
            return error_response("無法讀取頻道索引", 500)

    app.register_blueprint(bp)
