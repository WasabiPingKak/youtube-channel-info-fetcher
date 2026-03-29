import logging

from apiflask import APIBlueprint
from flask import abort, jsonify

from utils.channel_validator import is_valid_channel_id


def init_api_heatmap_route(app, db):
    bp = APIBlueprint("api_heatmap", __name__, tag="Heatmap")

    @bp.route("/api/heatmap/<channel_id>", methods=["GET"])
    @bp.doc(summary="取得頻道活躍熱力圖", description="回傳指定頻道的影片活躍時段統計矩陣")
    def get_video_heatmap(channel_id):
        if not is_valid_channel_id(channel_id):
            return jsonify({"error": "channel_id 格式不合法"}), 400

        try:
            # Firestore 路徑：channel_data/{channel_id}/heat_map/channel_video_heatmap
            doc_ref = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("heat_map")
                .document("channel_video_heatmap")
            )
            doc = doc_ref.get()

            if not doc.exists:
                logging.warning(f"[heatmap] 找不到資料：{channel_id}")
                abort(404, description="heatmap data not found.")

            all_range = doc.to_dict().get("all_range")
            if not all_range:
                logging.warning(f"[heatmap] all_range 欄位不存在：{channel_id}")
                abort(404, description="heatmap format invalid.")

            matrix = all_range.get("matrix")
            total_count = all_range.get("totalCount")

            if matrix is None or total_count is None:
                logging.error(f"[heatmap] 欄位缺失：{channel_id}")
                abort(500, description="matrix or totalCount missing.")

            return jsonify({"matrix": matrix, "totalCount": total_count})

        except Exception:
            logging.exception(f"[heatmap] 發生錯誤：{channel_id}")
            abort(500, description="internal server error")

    app.register_blueprint(bp)
