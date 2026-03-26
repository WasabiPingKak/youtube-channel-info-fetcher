from flask import request, jsonify
import logging
from utils.auth_decorator import require_auth
from utils.channel_validator import is_valid_channel_id

def init_quick_category_remove_route(app, db):
    @app.route("/api/quick-editor/channel-config-remove", methods=["POST"])
    @require_auth(db)
    def remove_keyword_from_config(auth_channel_id=None):
        try:
            data = request.get_json()
            logging.info(f"📨 [config-remove] 接收到前端 POST 資料：{data}")

            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id:
                return jsonify({"success": False, "message": "缺少必要欄位 channelId"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"success": False, "message": "channelId 格式不合法"}), 400
            if not keyword:
                return jsonify({"success": False, "message": "缺少必要欄位 keyword"}), 400

            # ✅ 驗證身份是否與目標 channel 相符
            if channel_id != auth_channel_id:
                logging.warning(f"⛔ 嘗試移除他人頻道資料：JWT={auth_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            # 🔧 讀取並處理 Firestore 設定
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
                    if sub_name == keyword:
                        logging.info(f"🗑 子分類名稱「{sub_name}」等於 keyword「{keyword}」，整個子分類移除")
                        modified = True
                        continue

                    if isinstance(keywords, list):
                        if keyword in keywords:
                            logging.info(f"🔎 關鍵字「{keyword}」出現在「{main_cat}／{sub_name}」中，移除該項")
                            filtered = [k for k in keywords if k != keyword]
                            modified = True
                        else:
                            filtered = keywords
                        updated_sub_map[sub_name] = filtered
                    else:
                        logging.warning(f"⚠️ 子分類「{sub_name}」格式非 list，保留原樣：{keywords}")
                        updated_sub_map[sub_name] = keywords

                updated_config[main_cat] = updated_sub_map

            if modified:
                logging.info(f"✅ [config-remove] 更新後 config：{updated_config}")
                config_ref.set(updated_config)
            else:
                logging.warning(f"❗ [config-remove] keyword「{keyword}」未出現在任何子分類名稱或陣列中，無需修改")

            return jsonify({"success": True})

        except Exception as e:
            logging.error("🔥 [config-remove] 發生錯誤", exc_info=True)
            return jsonify({"success": False, "message": "內部伺服器錯誤"}), 500
