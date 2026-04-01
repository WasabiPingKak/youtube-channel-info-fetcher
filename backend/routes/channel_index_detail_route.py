# routes/channel_index_detail_route.py

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud import firestore

from utils.channel_validator import is_valid_channel_id
from utils.error_response import error_response


def init_channel_index_detail_route(app, db: firestore.Client):
    bp = APIBlueprint("channel_index_detail_route", __name__, tag="Channel")

    @bp.route("/api/channels/index/<channel_id>", methods=["GET"])
    @bp.doc(
        summary="取得單一頻道索引資料",
        description="依 channel_id 從 channel_index_batch 取得單一頻道的基本資料",
    )
    def get_channel_index_detail(channel_id):
        if not is_valid_channel_id(channel_id):
            return error_response("channel_id 格式不合法", 400)

        root_ref = db.collection("channel_index_batch")
        docs = root_ref.stream()

        for doc in docs:
            data = doc.to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
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

    app.register_blueprint(bp)
