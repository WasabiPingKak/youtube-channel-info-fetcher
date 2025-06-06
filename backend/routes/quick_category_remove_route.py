from flask import request, jsonify
import logging


def init_quick_category_remove_route(app, db):
    @app.route("/api/quick-editor/channel-config-remove", methods=["POST"])
    def remove_keyword_from_config():
        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id:
                return jsonify({"status": "error", "message": "缺少必要欄位 channelId"}), 400
            if not keyword:
                return jsonify({"status": "error", "message": "缺少必要欄位 keyword"}), 400

            config_ref = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("settings")
                .document("config")
            )

            doc = config_ref.get()
            config_data = doc.to_dict() or {}

            modified = False
            updated_config = {}

            # 遍歷所有主分類與子分類
            for main_cat, sub_map in config_data.items():
                updated_sub_map = {}
                for sub_name, keywords in sub_map.items():
                    if isinstance(keywords, list):
                        filtered = [k for k in keywords if k != keyword]
                        if filtered != keywords:
                            modified = True
                        if filtered:  # 有剩下的才保留子分類
                            updated_sub_map[sub_name] = filtered
                    else:
                        updated_sub_map[sub_name] = keywords  # 異常資料格式，保留原值

                if updated_sub_map:  # 即使子分類全部清空也保留主分類（依你需求）
                    updated_config[main_cat] = updated_sub_map

            if modified:
                logging.info(f"🗑 [config-remove] 移除關鍵字「{keyword}」於 {channel_id}")
                config_ref.set(updated_config, merge=True)

            return jsonify({"status": "success"})

        except Exception as e:
            logging.error("🔥 [config-remove] 發生錯誤", exc_info=True)
            return jsonify({"status": "error", "message": str(e)}), 500
