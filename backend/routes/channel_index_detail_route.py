# routes/channel_index_detail_route.py

import logging

from apiflask import APIBlueprint
from flask import jsonify

from utils.channel_validator import is_valid_channel_id
from utils.error_response import error_response


def init_channel_index_detail_route(app, db):
    bp = APIBlueprint("channel_index_detail_route", __name__, tag="Channel")

    @bp.route("/api/channels/index/<channel_id>", methods=["GET"])
    @bp.doc(
        summary="取得單一頻道索引資料",
        description="依 channel_id 從 channel_index_batch 取得單一頻道的基本資料",
    )
    def get_channel_index_detail(channel_id):
        if not is_valid_channel_id(channel_id):
            return error_response("channel_id 格式不合法", 400)

        try:
            root_ref = db.collection("channel_index_batch")
            docs = root_ref.stream()

            for doc in docs:
                data = doc.to_dict()
                for entry in data.get("channels", []):
                    if entry.get("channel_id") == channel_id:
                        return jsonify(
                            {
                                "success": True,
                                "channel": {
                                    "channel_id": channel_id,
                                    "name": entry.get("name"),
                                    "url": entry.get("url"),
                                    "thumbnail": entry.get("thumbnail"),
                                    "countryCode": entry.get("countryCode", []),
                                    "enabled": entry.get("enabled", True),
                                    "priority": entry.get("priority", 0),
                                },
                            }
                        )

            return error_response("找不到該頻道", 404)

        except Exception:
            logging.exception("❌ 無法讀取頻道索引詳情")
            return error_response("無法讀取頻道索引", 500)

    app.register_blueprint(bp)
