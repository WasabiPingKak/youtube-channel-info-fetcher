# routes/channel_index_route.py

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud import firestore

from services.channel_index_service import get_all_enabled_channels_data


def init_channel_index_route(app, db: firestore.Client):
    bp = APIBlueprint("channel_index_route", __name__, tag="Channel")

    @bp.route("/api/channels/index", methods=["GET"])
    @bp.doc(
        summary="取得頻道索引",
        description="回傳所有啟用頻道清單、新加入頻道、以及總註冊數",
    )
    def get_all_enabled_channels():
        data = get_all_enabled_channels_data(db)
        return jsonify({"success": True, **data})

    app.register_blueprint(bp)
