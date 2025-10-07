from flask import request, jsonify
import logging
from firebase_admin import firestore
from utils.jwt_util import verify_jwt


def init_quick_category_apply_route(app, db):
    @app.route("/api/quick-editor/channel-config-apply", methods=["POST"])
    def apply_quick_category():
        try:
            # ✅ 取出 JWT 並驗證
            token = request.cookies.get("__session")
            if not token:
                logging.warning("🔒 未提供 __session JWT")
                return jsonify({"error": "未登入或權限不足"}), 401

            decoded = verify_jwt(token)
            if not decoded:
                logging.warning("🔒 JWT 驗證失敗")
                return jsonify({"error": "無效的 token"}), 403

            user_channel_id = decoded.get("channelId")
            if not user_channel_id:
                logging.warning("🔒 JWT 中缺少 channelId")
                return jsonify({"error": "無效的使用者身份"}), 403

            # ✅ 處理 payload
            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")
            targets = data.get("targets")

            if not channel_id:
                return (
                    jsonify({"status": "error", "message": "缺少必要欄位 channelId"}),
                    400,
                )
            if not keyword:
                return (
                    jsonify({"status": "error", "message": "缺少必要欄位 keyword"}),
                    400,
                )
            if not isinstance(targets, list) or not targets:
                return (
                    jsonify({"status": "error", "message": "缺少必要欄位 targets"}),
                    400,
                )

            # 🔐 channelId 與使用者 JWT 是否一致
            if channel_id != user_channel_id:
                logging.warning(
                    f"⛔ 嘗試寫入他人頻道資料：JWT={user_channel_id}, 請求 channel_id={channel_id}"
                )
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            # 🔧 Firestore 操作
            config_ref = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("settings")
                .document("config")
            )

            doc = config_ref.get()
            config_data = doc.to_dict() or {}
            updated_config = config_data.copy()

            # ✅ 確保四大主分類永遠存在，且型別為 dict（防止過去為 list）
            REQUIRED_MAIN_CATEGORIES = ["雜談", "遊戲", "音樂", "節目"]
            for cat in REQUIRED_MAIN_CATEGORIES:
                if not isinstance(updated_config.get(cat), dict):
                    updated_config[cat] = {}

            # ➤ 寫入分類設定
            for target in targets:
                main_category = target.get("mainCategory")
                subcategory_name = target.get("subcategoryName")

                if not main_category or not subcategory_name:
                    continue  # 跳過無效項目

                if not isinstance(updated_config.get(main_category), dict):
                    updated_config[main_category] = {}

                if subcategory_name == keyword:
                    updated_config[main_category].setdefault(subcategory_name, [])
                else:
                    updated_config[main_category].setdefault(subcategory_name, [])
                    if keyword not in updated_config[main_category][subcategory_name]:
                        updated_config[main_category][subcategory_name].append(keyword)

            logging.info(f"📥 正在儲存快速分類設定：{channel_id} - {keyword}")
            config_ref.set(updated_config, merge=True)

            return jsonify({"status": "success", "message": "已儲存分類設定"})

        except Exception as e:
            logging.error("🔥 快速分類 API 發生錯誤", exc_info=True)
            return jsonify({"status": "error", "message": "內部錯誤，請稍後再試"}), 500
