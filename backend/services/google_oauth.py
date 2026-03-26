# services/google_oauth.py
import json
import os
import requests
import logging

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

def exchange_code_for_tokens(code: str) -> dict:
    url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    # ✅ 印出將送出的 payload（除掉 secret）
    logging.info("[OAuth] 🔄 正在交換 token，傳送 payload：")
    safe_payload = payload.copy()
    safe_payload["client_secret"] = "*****"
    logging.info(safe_payload)

    response = requests.post(url, data=payload)

    if response.status_code != 200:
        try:
            detail = response.json()
        except (ValueError, json.JSONDecodeError):
            detail = response.text
        logging.error(f"[OAuth] ❌ Google 回應錯誤: {response.status_code} → {detail}")
        raise Exception(f"❌ Failed to exchange token: {response.status_code} → {detail}")

    logging.info("[OAuth] ✅ 成功取得 access_token")
    return response.json()


def get_channel_id(access_token: str) -> str:
    headers = {
        "Authorization": f"Bearer {access_token}",
    }
    params = {
        "part": "id",
        "mine": "true",
    }
    url = "https://www.googleapis.com/youtube/v3/channels"
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()

    items = response.json().get("items", [])
    if not items:
        return None
    return items[0]["id"]
