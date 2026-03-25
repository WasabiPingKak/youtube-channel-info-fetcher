from flask import Blueprint, request, redirect, current_app, jsonify, make_response
from services.google_oauth import exchange_code_for_tokens, get_channel_id
from services.firestore.auth_service import save_channel_auth
from utils.jwt_util import generate_jwt, JWT_EXP_HOURS
import hmac
import logging

def init_oauth_callback_route(app, db):
    oauth_bp = Blueprint("oauth", __name__)

    @oauth_bp.route("/oauth/callback")
    def oauth_callback():
        # ✅ 測試模式：印出授權結果並終止流程
        if current_app.config.get("OAUTH_DEBUG_MODE", False):
            logging.info("🧪 [Debug] OAuth callback triggered with:")
            logging.info(request.args.to_dict())
            return jsonify({
                "debug": "🧪 OAuth callback 測試模式",
                "request_args": request.args.to_dict()
            })

        # ✅ 驗證 OAuth state 防止 CSRF
        state_from_url = request.args.get("state")
        state_from_cookie = request.cookies.get("oauth_state")
        if not state_from_url or not state_from_cookie:
            logging.warning("⚠️ 缺少 OAuth state 參數")
            return "Missing OAuth state", 400
        if not hmac.compare_digest(state_from_url, state_from_cookie):
            logging.warning("⚠️ OAuth state 不一致，疑似 CSRF 攻擊")
            return "Invalid OAuth state", 403

        code = request.args.get("code")
        if not code:
            logging.warning("⚠️ 缺少授權 code")
            return "Missing authorization code", 400

        try:
            token_data = exchange_code_for_tokens(code)
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")

            if not access_token:
                logging.error("❌ 無法取得 access token")
                return "Failed to get access token", 400
            if not refresh_token:
                logging.warning("⚠️ 未提供 refresh token，可能使用者已授權過？")
                return "Missing refresh token. Please re-authorize with prompt=consent.", 400

            channel_id = get_channel_id(access_token)
            if not channel_id:
                logging.error("❌ 無法取得頻道 ID")
                return "Failed to fetch channel ID", 400

            save_channel_auth(db, channel_id, refresh_token)
            logging.info(f"✅ 頻道授權成功：{channel_id}")

            # 🎯 簽出 JWT 並寫入登入 cookie
            jwt_token = generate_jwt(channel_id)
            frontend_base = current_app.config.get("FRONTEND_BASE_URL", "")
            redirect_url = f"{frontend_base}/auth-loading?channel={channel_id}"

            response = make_response(redirect(redirect_url))
            response.set_cookie(
                "__session",
                jwt_token,
                max_age=60 * 60 * JWT_EXP_HOURS,
                path="/",
                httponly=True,
                secure=True,
                samesite="Lax"
            )
            # 清除已驗證的 oauth_state cookie
            response.set_cookie("oauth_state", "", max_age=0, path="/")
            return response

        except Exception as e:
            logging.exception("❌ OAuth callback 過程失敗")
            return "OAuth 認證失敗，請稍後再試", 500

    app.register_blueprint(oauth_bp)
