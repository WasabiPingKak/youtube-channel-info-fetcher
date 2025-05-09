from flask import Blueprint, request, jsonify
from firebase_admin.firestore import Client
from services.classified_video_fetcher import get_classified_videos

editor_data_v2_bp = Blueprint("editor_data_v2", __name__)

def init_editor_data_v2_route(app, db: Client):
    @editor_data_v2_bp.route("/api/categories/editor-data-v2", methods=["GET"])
    def get_editor_data_v2():
        try:
            channel_id = request.args.get("channel_id")
            if not channel_id:
                return jsonify({"error": "缺少 channel_id"}), 400

            # 1️⃣ 取得分類設定
            config_ref = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("settings")
                .document("config")
            )
            config_doc = config_ref.get()
            if not config_doc.exists:
                return jsonify({"error": "找不到分類設定"}), 404

            config_data = config_doc.to_dict()

            # 2️⃣ 呼叫分類邏輯（不過濾類型，回傳全部已分類影片）
            videos = get_classified_videos(db, channel_id, video_type=None)

            # 3️⃣ 組裝回傳格式
            return jsonify({
                "config": config_data,
                "videos": videos,
                "removedSuggestedKeywords": []
            })

        except Exception as e:
            return jsonify({"error": "處理錯誤", "details": str(e)}), 500

    app.register_blueprint(editor_data_v2_bp)
