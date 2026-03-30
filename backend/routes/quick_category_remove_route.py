import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud import firestore

from schemas.category_editor_schemas import QuickRemoveRequest
from utils.auth_decorator import require_auth

quick_remove_bp = APIBlueprint("quick_category_remove", __name__, tag="Category Editor")


def init_quick_category_remove_route(app, db):
    @quick_remove_bp.route("/api/quick-editor/channel-config-remove", methods=["POST"])
    @quick_remove_bp.doc(
        summary="移除分類關鍵字",
        description="從分類設定中移除指定關鍵字或子分類",
        security="CookieAuth",
    )
    @require_auth(db)
    @quick_remove_bp.input(QuickRemoveRequest, arg_name="body")
    def remove_keyword_from_config(body, auth_channel_id=None):
        try:
            # ✅ 驗證身份是否與目標 channel 相符
            if body.channelId != auth_channel_id:
                logging.warning(
                    f"⛔ 嘗試移除他人頻道資料：JWT={auth_channel_id}, 請求 channel_id={body.channelId}"
                )
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            # 🔧 讀取並處理 Firestore 設定
            config_ref = (
                db.collection("channel_data")
                .document(body.channelId)
                .collection("settings")
                .document("config")
            )

            @firestore.transactional
            def _remove_in_transaction(transaction):
                doc = config_ref.get(transaction=transaction)
                config_data = doc.to_dict() or {}
                logging.info(
                    f"📦 [config-remove] 原始 config 資料（{body.channelId}）: {config_data}"
                )

                modified = False
                updated_config = {}

                for main_cat, sub_map in config_data.items():
                    updated_sub_map = {}

                    for sub_name, keywords in sub_map.items():
                        if sub_name == body.keyword:
                            logging.info(
                                f"🗑 子分類名稱「{sub_name}」等於 keyword「{body.keyword}」，"
                                f"整個子分類移除"
                            )
                            modified = True
                            continue

                        if isinstance(keywords, list):
                            if body.keyword in keywords:
                                logging.info(
                                    f"🔎 關鍵字「{body.keyword}」出現在"
                                    f"「{main_cat}／{sub_name}」中，移除該項"
                                )
                                filtered = [k for k in keywords if k != body.keyword]
                                modified = True
                            else:
                                filtered = keywords
                            updated_sub_map[sub_name] = filtered
                        else:
                            logging.warning(
                                f"⚠️ 子分類「{sub_name}」格式非 list，保留原樣：{keywords}"
                            )
                            updated_sub_map[sub_name] = keywords

                    updated_config[main_cat] = updated_sub_map

                if modified:
                    logging.info(f"✅ [config-remove] 更新後 config：{updated_config}")
                    transaction.set(config_ref, updated_config)
                else:
                    logging.warning(
                        f"❗ [config-remove] keyword「{body.keyword}」"
                        f"未出現在任何子分類名稱或陣列中，無需修改"
                    )

            transaction = db.transaction()
            _remove_in_transaction(transaction)

            return jsonify({"success": True})

        except Exception:
            logging.error("🔥 [config-remove] 發生錯誤", exc_info=True)
            return jsonify({"success": False, "message": "內部伺服器錯誤"}), 500

    app.register_blueprint(quick_remove_bp)
