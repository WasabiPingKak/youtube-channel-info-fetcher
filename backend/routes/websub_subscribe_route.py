import logging
import os
import time
import requests
from datetime import datetime, timezone
from flask import Blueprint, request, Response, jsonify
from google.cloud.firestore import Client
from utils.channel_validator import is_valid_channel_id

websub_subscribe_bp = Blueprint("websub_subscribe", __name__)
HUB_URL = "https://pubsubhubbub.appspot.com/subscribe"
CALLBACK_URL = os.getenv("WEBSUB_CALLBACK_URL")
WEBSUB_SECRET = os.getenv("WEBSUB_SECRET", "")

RETRY_DELAY_SECONDS = 3
SLEEP_BETWEEN_REQUESTS = 0.3
# Cloud Run 預設 timeout 300 秒，保留 30 秒緩衝
MAX_EXECUTION_SECONDS = 270


def subscribe_channel_by_id(channel_id: str) -> bool:
    """
    可獨立呼叫的訂閱函式（初始化後觸發或 API 單獨測試）
    """
    if not channel_id:
        logging.warning("❌ 呼叫 subscribe_channel_by_id 時缺少 channel_id")
        return False

    if not CALLBACK_URL:
        logging.error("❌ 未設定 WEBSUB_CALLBACK_URL 環境變數")
        return False

    topic = f"https://www.youtube.com/xml/feeds/videos.xml?channel_id={channel_id}"
    payload = {
        "hub.mode": "subscribe",
        "hub.topic": topic,
        "hub.callback": CALLBACK_URL,
        "hub.verify": "async",
    }
    if WEBSUB_SECRET:
        payload["hub.secret"] = WEBSUB_SECRET

    logging.info(f"📡 單獨訂閱頻道：{channel_id}")
    try:
        response = requests.post(HUB_URL, data=payload, timeout=10)
        if response.status_code == 202:
            logging.info(f"✅ 訂閱成功：{channel_id}")
            return True
        else:
            logging.warning(
                f"❗訂閱失敗：{channel_id} → {response.status_code} - {response.text}"
            )
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"🔥 單筆訂閱發生例外：{channel_id}", exc_info=True)
        return False


def _log_job_result(db: Client, job_name: str, result: dict):
    """將排程任務執行結果寫入 Firestore scheduler_job_logs"""
    try:
        now = datetime.now(timezone.utc)
        doc_id = f"{job_name}_{now.strftime('%Y%m%d_%H%M%S')}"
        db.collection("scheduler_job_logs").document(doc_id).set({
            "job_name": job_name,
            "executed_at": now,
            "duration_seconds": result.get("duration_seconds"),
            "status": result.get("status"),
            "total_channels": result.get("total_channels", 0),
            "subscribed": result.get("subscribed", 0),
            "failed": result.get("failed", 0),
            "skipped": result.get("skipped", 0),
            "aborted_reason": result.get("aborted_reason"),
            "message": result.get("message"),
        })
    except Exception:
        logging.error("🔥 寫入 scheduler_job_logs 失敗", exc_info=True)


def init_websub_subscribe_route(app, db: Client):
    @websub_subscribe_bp.route("/api/websub/subscribe-all", methods=["POST"])
    def subscribe_all_channels():
        start_time = time.monotonic()
        result = {
            "status": "success",
            "total_channels": 0,
            "subscribed": 0,
            "failed": 0,
            "skipped": 0,
            "aborted_reason": None,
        }

        try:
            # 提前檢查 CALLBACK_URL
            if not CALLBACK_URL:
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

            result["total_channels"] = len(channels)
            logging.info(
                f"🔍 WEBSUB_CALLBACK_URL = {CALLBACK_URL}, "
                f"頻道數 = {len(channels)}"
            )

            for item in channels:
                # Timeout 保護：快到上限時提前中斷
                elapsed = time.monotonic() - start_time
                if elapsed >= MAX_EXECUTION_SECONDS:
                    result["aborted_reason"] = (
                        f"已達執行時間上限 {MAX_EXECUTION_SECONDS}s，"
                        f"提前中斷（已處理 {result['subscribed'] + result['failed']} 筆）"
                    )
                    logging.warning(f"⏰ {result['aborted_reason']}")
                    break

                channel_id = item.get("channel_id")
                if not channel_id:
                    result["skipped"] += 1
                    continue

                success = False
                for attempt in range(2):
                    success = subscribe_channel_by_id(channel_id)
                    if success:
                        result["subscribed"] += 1
                        break
                    elif attempt == 0:
                        time.sleep(RETRY_DELAY_SECONDS)

                if not success:
                    result["failed"] += 1

                time.sleep(SLEEP_BETWEEN_REQUESTS)

            result["duration_seconds"] = round(time.monotonic() - start_time, 2)
            result["status"] = "success" if not result["aborted_reason"] else "partial"
            result["message"] = (
                f"已發送訂閱請求 {result['subscribed']} 筆，"
                f"失敗 {result['failed']} 筆"
            )

            logging.info(f"✅ websub subscribe-all 完成：{result}")
            _log_job_result(db, "websub-subscribe-all", result)
            return jsonify(result), 200

        except Exception as e:
            result["duration_seconds"] = round(time.monotonic() - start_time, 2)
            result["status"] = "error"
            result["message"] = str(e)
            logging.error("🔥 訂閱發送失敗", exc_info=True)
            _log_job_result(db, "websub-subscribe-all", result)
            return jsonify(result), 500

    @websub_subscribe_bp.route("/api/websub/subscribe-one", methods=["POST"])
    def subscribe_single_channel():
        channel_id = request.args.get("channel_id")
        if not channel_id:
            return Response("❌ 缺少 channel_id 參數", status=400)
        if not is_valid_channel_id(channel_id):
            return Response("❌ channel_id 格式不合法", status=400)

        success = subscribe_channel_by_id(channel_id)
        if success:
            return Response(f"✅ 已訂閱頻道 {channel_id}", status=200)
        else:
            return Response(f"❌ 訂閱失敗：{channel_id}", status=500)

    app.register_blueprint(websub_subscribe_bp)
