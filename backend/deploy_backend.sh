#!/bin/bash

# ✅ 檢查參數
if [ $# -eq 0 ]; then
  echo "❌ 請指定部署目標環境參數：--prod 或 --staging"
  exit 1
fi

# ✅ 初始化變數
SERVICE_NAME=""
ENV_MODE=""

if [ "$1" == "--staging" ]; then
  ENV_MODE="staging"
  SERVICE_NAME="youtube-api-staging-service"
elif [ "$1" == "--prod" ]; then
  ENV_MODE="production"
  SERVICE_NAME="youtube-api-service"
else
  echo "❌ 不支援的參數：$1"
  echo "請使用 --prod 或 --staging"
  exit 1
fi

# ✅ 載入共用設定（預設從 .env.local）
if [ ! -f ".env.local" ]; then
  echo "❌ 找不到 .env.local"
  exit 1
fi
set -o allexport
source .env.local
set +o allexport

# ✅ 若為 production，覆蓋正式參數
if [ "$ENV_MODE" == "production" ]; then
  if [ ! -f ".env.production" ]; then
    echo "❌ 找不到 .env.production"
    exit 1
  fi
  set -o allexport
  source .env.production
  set +o allexport
fi

# ✅ 共用部署參數
PROJECT_ID="vtuber-channel-analyzer-v3"
REGION="asia-east1"
IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# ✅ 設定 GCP 專案與啟用服務
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com containerregistry.googleapis.com

echo ""
echo "📦 建立 Container 映像..."
gcloud builds submit --tag "$IMAGE_URI"
if [ $? -ne 0 ]; then
  echo "❌ 建立映像失敗"
  exit 1
fi

# ✅ 檢查服務是否已存在
SERVICE_EXISTS=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(metadata.name)" 2>/dev/null)
if [ -z "$SERVICE_EXISTS" ]; then
  echo ""
  echo "🆕 第一次建立 Cloud Run 服務（不使用 --no-traffic）"
  NO_TRAFFIC_FLAG=""
else
  echo ""
  echo "🔁 Cloud Run 服務已存在，使用 --no-traffic 部署"
  NO_TRAFFIC_FLAG="--no-traffic"
fi

# ✅ 部署到 Cloud Run
echo "🚀 部署映像至 Cloud Run：$SERVICE_NAME"
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region="$REGION" \
  --allow-unauthenticated \
  $NO_TRAFFIC_FLAG \
  --set-env-vars \
    "API_KEY=$API_KEY,\
    INPUT_CHANNEL=$INPUT_CHANNEL,\
    GOOGLE_CLOUD_PROJECT=$PROJECT_ID,\
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,\
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,\
    GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI,\
    FRONTEND_BASE_URL=$FRONTEND_BASE_URL,\
    JWT_SECRET=$JWT_SECRET,\
    ALLOWED_ORIGINS=$ALLOWED_ORIGINS"

if [ $? -ne 0 ]; then
  echo "❌ 後端部署失敗"
  exit 1
fi

# ✅ 切換流量（僅限非首次部署時執行）
if [ -n "$NO_TRAFFIC_FLAG" ]; then
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
    echo "📋 以下是目前 revision 狀態："
    gcloud run revisions list --service="$SERVICE_NAME" --region="$REGION"
    exit 1
  fi
else
  echo ""
  echo "✅ 第一次部署完成，Cloud Run 服務已建立並預設導流"
fi
