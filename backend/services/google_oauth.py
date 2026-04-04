# services/google_oauth.py
import json
import logging
import os

import requests

from utils.exceptions import ExternalServiceError


def exchange_code_for_tokens(code: str) -> dict:
    url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "grant_type": "authorization_code",
    }

    # ✅ 印出將送出的 payload（除掉 secret）
    logging.info("[OAuth] 🔄 正在交換 token，傳送 payload：")
    safe_payload = payload.copy()
    safe_payload["code"] = "*****"
    safe_payload["client_secret"] = "*****"
    logging.info(safe_payload)

    response = requests.post(url, data=payload, timeout=10)

    if response.status_code != 200:
        try:
            detail = response.json()
        except (ValueError, json.JSONDecodeError):
            detail = response.text
        logging.error(f"[OAuth] ❌ Google 回應錯誤: {response.status_code} → {detail}")
        raise ExternalServiceError(
            "OAuth token 交換失敗",
            log_message=f"Google OAuth 回應錯誤: {response.status_code} → {detail}",
        )

    logging.info("[OAuth] ✅ 成功取得 access_token")
    return response.json()  # type: ignore[no-any-return]


def get_channel_id(access_token: str) -> str | None:
    headers = {
        "Authorization": f"Bearer {access_token}",
    }
    params = {
        "part": "id",
        "mine": "true",
    }
    url = "https://www.googleapis.com/youtube/v3/channels"
    response = requests.get(url, headers=headers, params=params, timeout=10)
    response.raise_for_status()

    items = response.json().get("items", [])
    if not items:
        return None
    return items[0]["id"]  # type: ignore[no-any-return]
