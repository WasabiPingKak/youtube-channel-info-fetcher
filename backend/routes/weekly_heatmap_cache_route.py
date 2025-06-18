from flask import Blueprint, jsonify
import logging
import traceback
from services.heatmap_cache_writer import write_weekly_heatmap_cache

def init_weekly_heatmap_cache_route(app, db):
    bp = Blueprint("weekly_heatmap_cache_route", __name__)

    @bp.route("/admin/update_weekly_heatmap_cache", methods=["GET"])
    def update_weekly_heatmap_cache():
        try:
            logging.info("🧱 [admin] 開始重新建構 weekly heatmap 快取資料...")
            success = write_weekly_heatmap_cache(db)
            if success:
                return jsonify({"message": "✅ 快取更新成功"}), 200
            else:
                return jsonify({"error": "⚠️ 快取更新失敗"}), 500
        except Exception as e:
            logging.error("🔥 快取更新時發生例外：%s", traceback.format_exc())
            return jsonify({"error": str(e)}), 500

    app.register_blueprint(bp)
