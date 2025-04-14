#!/bin/bash

# ✅ 載入 .env 中的環境變數（請確保這一行在腳本最上面）
set -o allexport
source .env
set +o allexport

# ✅ 可自訂參數
SERVICE_NAME="youtube-api-service"
PROJECT_ID="vtuber-channel-analyzer-v3"
REGION="asia-east1"
GOOGLE_CREDENTIALS="firebase-key.json"

# ✅ 設定 GCP 專案
gcloud config set project "$PROJECT_ID"

# ✅ 確保啟用必要服務（第一次部署時需要）
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# ✅ 開始部署
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "API_KEY=$API_KEY,INPUT_CHANNEL=$INPUT_CHANNEL,GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_CREDENTIALS"

# ✅ 取得服務網址
echo ""
echo "🔗 部署完成，服務網址如下："
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format "value(status.url)"
