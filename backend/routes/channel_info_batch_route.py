# routes/channel_info_batch_route.py

import logging

from apiflask import APIBlueprint
from flask import jsonify

from schemas.channel_info_batch_schema import ChannelInfoBatchRequest


def init_channel_info_batch_route(app, db):
    bp = APIBlueprint("channel_info_batch_route", __name__, tag="Channel")

    @bp.route("/api/channels/info/batch", methods=["POST"])
    @bp.doc(
        summary="批次取得頻道資訊",
        description="依多個 channel_id 批次取得頻道名稱、URL、縮圖",
    )
    @bp.input(ChannelInfoBatchRequest, arg_name="body")
    def get_channel_info_batch(body):
        try:
            channels = {}
            for channel_id in body.channel_ids:
                doc_ref = (
                    db.collection("channel_data")
                    .document(channel_id)
                    .collection("channel_info")
                    .document("info")
                )
                doc = doc_ref.get()
                if doc.exists:
                    data = doc.to_dict()
                    channels[channel_id] = {
                        "name": data.get("name"),
                        "url": data.get("url"),
                        "thumbnail": data.get("thumbnail"),
                    }

            return jsonify({"success": True, "channels": channels})

        except Exception:
            logging.exception("❌ 無法批次讀取頻道資訊")
            return jsonify({"success": False, "error": "無法讀取頻道資訊"}), 500

    app.register_blueprint(bp)
