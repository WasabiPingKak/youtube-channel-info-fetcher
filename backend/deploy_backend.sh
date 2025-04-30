#!/bin/bash

# ✅ 載入 .env 中的環境變數
set -o allexport
source .env.local
set +o allexport

# ✅ 自訂參數
SERVICE_NAME="youtube-api-service"
PROJECT_ID="vtuber-channel-analyzer-v3"
REGION="asia-east1"
IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# ✅ 設定 GCP 專案
gcloud config set project "$PROJECT_ID"

# ✅ 確保必要 API 已啟用
gcloud services enable run.googleapis.com containerregistry.googleapis.com

echo ""
echo "📦 建立 Container 映像..."
gcloud builds submit --tag "$IMAGE_URI"
if [ $? -ne 0 ]; then
  echo "❌ 建立映像失敗"
  exit 1
fi

echo ""
echo "🚀 部署映像至 Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --allow-unauthenticated \
  --no-traffic \
  --set-env-vars "API_KEY=$API_KEY,INPUT_CHANNEL=$INPUT_CHANNEL,GOOGLE_CLOUD_PROJECT=$PROJECT_ID"

if [ $? -ne 0 ]; then
  echo "❌ 後端部署失敗"
  exit 1
fi

echo ""
echo "🔍 查詢最新 READY 狀態的 revision..."
LATEST_READY_REVISION=$(gcloud run revisions list \
  --service="$SERVICE_NAME" \
  --region="$REGION" \
  --filter="status.conditions.type=Ready AND status.conditions.status=True" \
  --sort-by="~metadata.creationTimestamp" \
  --limit=1 \
  --format="value(metadata.name)")

if [ -n "$LATEST_READY_REVISION" ]; then
  LATEST_URL=$(gcloud run revisions describe "$LATEST_READY_REVISION" \
  --region="$REGION" \
  --format="value(status.url)")

  echo "🔁 切換流量到最新 READY 版本：$LATEST_READY_REVISION"
  gcloud run services update-traffic "$SERVICE_NAME" \
    --region="$REGION" \
    --to-revisions="$LATEST_READY_REVISION=100"

  echo ""
  echo "✅ 部署完成，流量已導向：$LATEST_READY_REVISION"
  echo "🔗 可用於測試的後端 URL：$LATEST_URL"
else
  echo "❌ 找不到 READY 的 revision，無法切換流量"
  exit 1
fi
