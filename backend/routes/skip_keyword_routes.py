# routes/skip_keyword_route.py

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import logging

def init_skip_keyword_routes(app, db):
    bp = Blueprint("skip_keyword", __name__, url_prefix="/api/quick-editor/skip-keyword")

    @bp.route("/add", methods=["POST"])
    def add_skipped_keyword():
        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id or not keyword:
                return jsonify({"error": "channelId 與 keyword 為必填"}), 400

            doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("skip_keywords")
            doc_ref.set({"skipped": firestore.ArrayUnion([keyword])}, merge=True)

            return jsonify({"success": True})

        except Exception as e:
            logging.error("🔥 加入略過關鍵字失敗：%s", str(e), exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    @bp.route("/remove", methods=["POST"])
    def remove_skipped_keyword():
        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id or not keyword:
                return jsonify({"error": "channelId 與 keyword 為必填"}), 400

            doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("skip_keywords")
            doc_ref.set({"skipped": firestore.ArrayRemove([keyword])}, merge=True)

            return jsonify({"success": True})

        except Exception as e:
            logging.error("🔥 移除略過關鍵字失敗：%s", str(e), exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    app.register_blueprint(bp)
