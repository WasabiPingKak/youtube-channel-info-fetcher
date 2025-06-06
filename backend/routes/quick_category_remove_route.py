from flask import request, jsonify
import logging


def init_quick_category_remove_route(app, db):
    @app.route("/api/quick-editor/channel-config-remove", methods=["POST"])
    def remove_keyword_from_config():
        try:
            data = request.get_json()
            logging.info(f"📨 [config-remove] 接收到前端 POST 資料：{data}")

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
            logging.info(f"📦 [config-remove] 原始 config 資料（{channel_id}）: {config_data}")

            modified = False
            updated_config = {}

            for main_cat, sub_map in config_data.items():
                updated_sub_map = {}

                for sub_name, keywords in sub_map.items():
                    # ✅ 子分類名稱等於 keyword → 移除整個子分類
                    if sub_name == keyword:
                        logging.info(f"🗑 子分類名稱「{sub_name}」等於 keyword「{keyword}」，整個子分類移除")
                        modified = True
                        continue

                    # ✅ 子分類內容為 list，檢查是否有 keyword 出現
                    if isinstance(keywords, list):
                        if keyword in keywords:
                            logging.info(f"🔎 關鍵字「{keyword}」出現在「{main_cat}／{sub_name}」中，移除該項")
                            filtered = [k for k in keywords if k != keyword]
                            modified = True
                        else:
                            filtered = keywords
                        # ✅ 即使 filtered 為空，也要保留子分類名稱
                        updated_sub_map[sub_name] = filtered
                    else:
                        logging.warning(f"⚠️ 子分類「{sub_name}」格式非 list，保留原樣：{keywords}")
                        updated_sub_map[sub_name] = keywords

                # ✅ 保留主分類，即使其子分類為空 dict
                updated_config[main_cat] = updated_sub_map

            if modified:
                logging.info(f"✅ [config-remove] 更新後 config：{updated_config}")
                config_ref.set(updated_config)
            else:
                logging.warning(f"❗ [config-remove] keyword「{keyword}」未出現在任何子分類名稱或陣列中，無需修改")

            return jsonify({"status": "success"})

        except Exception as e:
            logging.error("🔥 [config-remove] 發生錯誤", exc_info=True)
            return jsonify({"status": "error", "message": str(e)}), 500
