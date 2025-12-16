import os
import traceback
import logging
import time

from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# --- 基本設定 ---
# 設定日誌記錄
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# 初始化 Flask 應用
app = Flask(__name__)

# --- Firebase 初始化 ---
db = None
firebase_initialized = False
initialization_error_message = None

try:
    logging.info("🔄 開始初始化 Firebase Admin SDK...")

    # 檢查是否有指定金鑰檔案路徑
    key_path = "/app/firebase-key.json"

    if key_path:
        logging.info(f"🔑 偵測到 GOOGLE_APPLICATION_CREDENTIALS: {key_path}")
        if not os.path.exists(key_path):
            raise FileNotFoundError(f"指定的金鑰檔案不存在: {key_path}")
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        logging.info(f"✅ 使用金鑰檔案 {key_path} 初始化成功。")
        sa_email = cred.service_account_email
        project_id = cred.project_id
        logging.info(f"🔑 金鑰服務帳號: {sa_email}")
        logging.info(f"🆔 金鑰專案 ID: {project_id}")

    else:
        logging.info(
            "🔑 未偵測到 GOOGLE_APPLICATION_CREDENTIALS，嘗試使用 Application Default Credentials (ADC)..."
        )
        # 不需要特別參數，SDK 會自動尋找 ADC
        firebase_admin.initialize_app()
        logging.info("✅ 使用 ADC 初始化成功。")
        # 注意：使用 ADC 時，不容易直接取得服務帳號 email 和 project_id，
        # 但可以在 GCP Console 的 Cloud Run 服務設定中確認執行身分 SA。
        # 可以嘗試從環境變數獲取 Project ID (通常由 Cloud Run 自動注入)
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
        logging.info(f"🆔 環境變數 GOOGLE_CLOUD_PROJECT: {project_id}")

    # 取得 Firestore client，明確指定 database ID (建議 #2)
    logging.info(" Firestore client 使用 database='(default)'")
    db = firestore.client()
    logging.info(f"🧩 Firestore client 建立完成: {db}")

    # 驗證 Project ID 是否與預期一致 (如果可以取得的話)
    # 注意：firestore.client().project 在某些環境下可能不是直接的字串 ID
    try:
        # 嘗試讀取一個不存在的文件來間接確認 project ID (如果上面無法取得)
        # 這是一個技巧，不保證在所有情況下都有效
        if not project_id:
            _ = db.collection("__test_project_check__").document("__check__").get()
        # 如果上面讀取報錯，錯誤訊息中通常會包含 project ID
    except Exception as proj_check_e:
        logging.warning(
            f"⚠️ 無法直接驗證 Firestore client 的 Project ID，但初始化似乎成功。間接檢查錯誤: {proj_check_e}"
        )
        # 這裡可以加入更多邏輯來從錯誤訊息中提取 project ID，但暫時從簡

    firebase_initialized = True
    logging.info("✅ Firebase Admin SDK 初始化完成。")

except Exception as e:
    initialization_error_message = traceback.format_exc()
    logging.error(f"🔥 Firebase Admin SDK 初始化失敗:\n{initialization_error_message}")

# --- Flask 路由定義 ---


@app.route("/")
def index():
    """提供一個基本端點，確認服務正在運行。"""
    if firebase_initialized:
        return "<h1>Firestore 測試服務 (Firebase SDK 初始化成功)</h1>", 200
    else:
        return (
            f"<h1>Firestore 測試服務 (Firebase SDK 初始化失敗)</h1><pre>{initialization_error_message}</pre>",
            500,
        )


@app.route("/test-write", methods=["GET"])
def test_firestore_write():
    """測試寫入 Firestore 的端點。"""
    if not firebase_initialized or db is None:
        logging.error("❌ 因為 Firebase SDK 未成功初始化，無法執行寫入測試。")
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Firebase SDK initialization failed.",
                    "details": initialization_error_message,
                }
            ),
            500,
        )

    # 取得延遲秒數 (建議 #5) - 可選，透過 query string 傳入，例如 /test-write?delay=60
    delay_seconds = request.args.get("delay", default=0, type=int)
    if delay_seconds > 0:
        logging.info(f"⏳ 收到延遲要求，將在寫入前等待 {delay_seconds} 秒...")
        time.sleep(delay_seconds)
        logging.info("⏳ 延遲結束，嘗試寫入 Firestore...")

    try:
        logging.info(
            "✍️ 嘗試寫入 Firestore 文件: collections/test_minimal/documents/test_doc"
        )
        doc_ref = db.collection("test_minimal").document("test_doc")
        write_result = doc_ref.set(
            {
                "message": "Minimal test successful!",
                "timestamp": firestore.SERVER_TIMESTAMP,  # 使用伺服器時間戳
            }
        )
        logging.info(f"✅ Firestore 寫入成功！ WriteResult: {write_result}")
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Successfully wrote to Firestore collection 'test_minimal', document 'test_doc'.",
                }
            ),
            200,
        )

    except Exception as e:
        error_trace = traceback.format_exc()
        error_type = type(e).__name__
        error_message = str(e)
        logging.error(f"🔥 Firestore 寫入失敗:\n{error_trace}")
        logging.error(f"❗錯誤類型: {error_type}")
        logging.error(f"❗錯誤訊息: {error_message}")

        # 特別檢查是否為 404 Not Found 錯誤
        is_404_not_found = False
        if (
            "404" in error_message
            and "database" in error_message
            and "does not exist" in error_message
        ):
            is_404_not_found = True
            logging.error("‼️ 偵測到 '404 Database Not Found' 錯誤！")

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Failed to write to Firestore.",
                    "error_type": error_type,
                    "error_message": error_message,
                    "is_404_not_found": is_404_not_found,  # 額外標記是否為目標錯誤
                    "traceback": error_trace,
                }
            ),
            500,
        )


# --- 本機運行 (用於開發測試，Cloud Run 會使用 Gunicorn 等) ---
if __name__ == "__main__":
    # 注意：在本機運行時，您需要設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數
    # 指向您的 firebase-key.json 檔案，或者確保您已透過 gcloud auth application-default login 登入。
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"🚀 啟動 Flask 開發伺服器於 http://localhost:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)
