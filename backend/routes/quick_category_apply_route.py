from flask import request, jsonify
import logging
from firebase_admin import firestore


def init_quick_category_apply_route(app, db):
    @app.route("/api/quick-editor/channel-config-apply", methods=["POST"])
    def apply_quick_category():
        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")
            targets = data.get("targets")

            if not channel_id:
                return jsonify({"status": "error", "message": "缺少必要欄位 channelId"}), 400
            if not keyword:
                return jsonify({"status": "error", "message": "缺少必要欄位 keyword"}), 400
            if not isinstance(targets, list) or not targets:
                return jsonify({"status": "error", "message": "缺少必要欄位 targets"}), 400

            config_ref = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("settings")
                .document("config")
            )

            doc = config_ref.get()
            config_data = doc.to_dict() or {}

            updated_config = config_data.copy()
            for target in targets:
                main_category = target.get("mainCategory")
                subcategory_name = target.get("subcategoryName")

                if not main_category or not subcategory_name:
                    continue  # 跳過無效的項目

                updated_config.setdefault(main_category, {})

                if subcategory_name == keyword:
                    # ⛔ 不重複儲存 keyword
                    updated_config[main_category].setdefault(subcategory_name, [])
                else:
                    # ✅ 子分類名稱 ≠ keyword，需記錄關鍵字
                    updated_config[main_category].setdefault(subcategory_name, [])
                    if keyword not in updated_config[main_category][subcategory_name]:
                        updated_config[main_category][subcategory_name].append(keyword)

            logging.info(f"📥 正在儲存快速分類設定：{channel_id} - {keyword}")
            config_ref.set(updated_config, merge=True)

            return jsonify({"status": "success", "message": "已儲存分類設定"})

        except Exception as e:
            logging.error("🔥 快速分類 API 發生錯誤", exc_info=True)
            return jsonify({"status": "error", "message": "內部錯誤，請稍後再試"}), 500

