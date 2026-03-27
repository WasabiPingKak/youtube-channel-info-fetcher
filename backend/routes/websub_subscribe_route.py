import logging
import os
import time
from datetime import UTC, datetime

import requests
from flask import Blueprint, jsonify, request
from google.cloud.firestore import Client

from utils.admin_auth import require_admin_key
from utils.channel_validator import is_valid_channel_id
from utils.cloud_tasks_client import dispatch_tasks_batch

websub_subscribe_bp = Blueprint("websub_subscribe", __name__)
HUB_URL = "https://pubsubhubbub.appspot.com/subscribe"


def _get_callback_url() -> str:
    """每次呼叫時讀取環境變數，避免 module-level 快取導致 cold start 問題"""
    return os.getenv("WEBSUB_CALLBACK_URL", "")


def subscribe_channel_by_id(channel_id: str) -> bool:
    """
    可獨立呼叫的訂閱函式（Cloud Tasks 觸發或 API 單獨測試）
    """
    if not channel_id:
        logging.warning("❌ 呼叫 subscribe_channel_by_id 時缺少 channel_id")
        return False

    callback_url = _get_callback_url()
    if not callback_url:
        logging.error("❌ 未設定 WEBSUB_CALLBACK_URL 環境變數")
        return False

    topic = f"https://www.youtube.com/xml/feeds/videos.xml?channel_id={channel_id}"
    payload = {
        "hub.mode": "subscribe",
        "hub.topic": topic,
        "hub.callback": callback_url,
        "hub.verify": "async",
    }

    websub_secret = os.getenv("WEBSUB_SECRET", "")
    if websub_secret:
        payload["hub.secret"] = websub_secret

    logging.info(f"📡 單獨訂閱頻道：{channel_id}")
    try:
        response = requests.post(HUB_URL, data=payload, timeout=10)
        if response.status_code == 202:
            logging.info(f"✅ 訂閱成功：{channel_id}")
            return True
        else:
            logging.warning(f"❗訂閱失敗：{channel_id} → {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException:
        logging.error(f"🔥 單筆訂閱發生例外：{channel_id}", exc_info=True)
        return False


def _log_job_result(db: Client, job_name: str, result: dict):
    """將排程任務執行結果寫入 Firestore scheduler_job_logs"""
    try:
        now = datetime.now(UTC)
        doc_id = f"{job_name}_{now.strftime('%Y%m%d_%H%M%S')}"
        db.collection("scheduler_job_logs").document(doc_id).set(
            {
                "job_name": job_name,
                "executed_at": now,
                "duration_seconds": result.get("duration_seconds"),
                "status": result.get("status"),
                "total_channels": result.get("total_channels", 0),
                "dispatched": result.get("dispatched", 0),
                "failed": result.get("failed", 0),
                "skipped": result.get("skipped", 0),
                "message": result.get("message"),
            }
        )
    except Exception:
        logging.error("🔥 寫入 scheduler_job_logs 失敗", exc_info=True)


def init_websub_subscribe_route(app, db: Client):
    @websub_subscribe_bp.route("/api/websub/subscribe-all", methods=["POST"])
    @require_admin_key
    def subscribe_all_channels():
        """
        讀取所有頻道，透過 Cloud Tasks 非同步派發訂閱任務。
        每個頻道獨立一個 task，不會因為數量多而 timeout。
        """
        start_time = time.monotonic()
        result = {
            "status": "success",
            "total_channels": 0,
            "dispatched": 0,
            "failed": 0,
            "skipped": 0,
        }

        try:
            callback_url = _get_callback_url()
            if not callback_url:
                result["status"] = "error"
                result["message"] = "未設定 WEBSUB_CALLBACK_URL 環境變數"
                logging.error(f"❌ {result['message']}")
                return jsonify(result), 400

            doc = db.collection("channel_sync_index").document("index_list").get()
            data = doc.to_dict() or {}
            channels = data.get("channels", [])

            if not channels:
                result["status"] = "error"
                result["message"] = "無頻道資料可訂閱"
                return jsonify(result), 400

            # 過濾出有效的 channel_id
            valid_params = []
            for item in channels:
                channel_id = item.get("channel_id")
                if channel_id:
                    valid_params.append({"channel_id": channel_id})
                else:
                    result["skipped"] += 1

            result["total_channels"] = len(channels)

            logging.info(
                f"📤 websub subscribe-all：準備派發 {len(valid_params)} 個 "
                f"Cloud Tasks（CALLBACK_URL={callback_url}）"
            )

            # 透過 Cloud Tasks 批次派發
            batch_result = dispatch_tasks_batch(
                "/api/websub/subscribe-one",
                params_list=valid_params,
            )
            result["dispatched"] = batch_result["dispatched"]
            result["failed"] = batch_result["failed"]

            result["duration_seconds"] = round(time.monotonic() - start_time, 2)
            result["status"] = "success" if result["failed"] == 0 else "partial"
            result["message"] = (
                f"已派發 {result['dispatched']} 個訂閱任務，失敗 {result['failed']} 個"
            )

            logging.info(f"✅ websub subscribe-all 完成：{result}")
            _log_job_result(db, "websub-subscribe-all", result)
            return jsonify(result), 200

        except Exception:
            result["duration_seconds"] = round(time.monotonic() - start_time, 2)
            result["status"] = "error"
            result["message"] = "訂閱派發過程發生錯誤"
            logging.error("🔥 訂閱派發失敗", exc_info=True)
            _log_job_result(db, "websub-subscribe-all", result)
            return jsonify(result), 500

    @websub_subscribe_bp.route("/api/websub/subscribe-one", methods=["POST"])
    def subscribe_single_channel():
        """
        訂閱單一頻道。可由 Cloud Tasks 呼叫，也可手動測試。
        Cloud Tasks 會自動 retry 失敗的 task。
        """
        channel_id = request.args.get("channel_id")
        if not channel_id:
            return jsonify({"error": "缺少 channel_id 參數"}), 400
        if not is_valid_channel_id(channel_id):
            return jsonify({"error": "channel_id 格式不合法"}), 400

        success = subscribe_channel_by_id(channel_id)
        if success:
            return jsonify({"status": "ok", "channel_id": channel_id}), 200
        else:
            # 回傳 500 讓 Cloud Tasks 知道需要 retry
            return jsonify({"error": f"訂閱失敗：{channel_id}"}), 500

    app.register_blueprint(websub_subscribe_bp)
