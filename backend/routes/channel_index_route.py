# routes/channel_index_route.py

import logging
from flask import Blueprint, jsonify
from firebase_admin import firestore

def init_channel_index_route(app, db):
    bp = Blueprint("channel_index_route", __name__)

    @bp.route("/api/channels/index", methods=["GET"])
    def get_all_enabled_channels():
        """
        從所有 batch 檔中抓出 enabled: true 的頻道清單。
        """
        try:
            root_ref = db.collection("channel_index_batch")
            docs = root_ref.stream()

            all_channels = []

            for doc in docs:
                data = doc.to_dict()
                batch_channels = data.get("channels", [])
                for entry in batch_channels:
                    if entry.get("enabled") is True:
                        all_channels.append({
                            "channel_id": entry.get("channel_id"),
                            "name": entry.get("name"),
                            "url": entry.get("url"),
                            "thumbnail": entry.get("thumbnail"),
                            "priority": entry.get("priority", 0),
                        })

            sorted_channels = sorted(
                all_channels,
                key=lambda c: (-c["priority"], c["name"])
            )

            return jsonify({
                "success": True,
                "channels": sorted_channels
            })

        except Exception as e:
            logging.exception("❌ 無法讀取頻道索引")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500

    app.register_blueprint(bp)
