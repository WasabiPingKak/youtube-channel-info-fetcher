#!/bin/bash
set -euo pipefail

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

# ✅ 仍載入 .env.local（因為 staging 的非敏感值也在這裡）
if [ ! -f ".env.local" ]; then
  echo "❌ 找不到 .env.local"
  exit 1
fi
echo "📂 載入預設參數：.env.local"
set -o allexport
source .env.local
set +o allexport

# ✅ 根據環境載入對應的環境變數檔案
if [ "$ENV_MODE" == "production" ]; then
  if [ ! -f ".env.production" ]; then
    echo "❌ 找不到 .env.production"
    exit 1
  fi
  echo "📂 載入 production 參數：.env.production"
  set -o allexport
  source .env.production
  set +o allexport
elif [ "$ENV_MODE" == "staging" ]; then
  if [ ! -f ".env.staging" ]; then
    echo "❌ 找不到 .env.staging"
    exit 1
  fi
  echo "📂 載入 staging 參數：.env.staging"
  set -o allexport
  source .env.staging
  set +o allexport
fi

# ✅ 共用部署參數
PROJECT_ID="vtuber-channel-analyzer-v3"
REGION="asia-east1"
IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# ✅ Secret Manager
JWT_SECRET_NAME="youtube-api-jwt-secret"
API_KEY_SECRET_NAME="youtube-api-api-key"
GOOGLE_CLIENT_SECRET_NAME="youtube-api-google-client-secret"
ADMIN_API_KEY_SECRET_NAME="youtube-api-admin-api-key"

# ✅ Admin allowlist
ADMIN_CHANNEL_IDS_SECRET_NAME="ADMIN_CHANNEL_IDS"

# ✅ Secret Manager（ECPay，不用 youtube 前綴）
ECPAY_MERCHANT_ID_SECRET_NAME="ecpay-merchant-id"
ECPAY_HASH_KEY_SECRET_NAME="ecpay-hash-key"
ECPAY_HASH_IV_SECRET_NAME="ecpay-hash-iv"

# ✅ 設定 GCP 專案與啟用服務
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# ✅ 寫入 Git Commit Hash 至 version.txt
commit_hash=$(git rev-parse --short=6 HEAD)
echo "🔖 寫入 Git Commit Hash: $commit_hash"
echo "$commit_hash" > version.txt

echo ""
echo "📦 建立 Container 映像（no-cache）..."
cat > /tmp/_cloudbuild.yaml <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '--no-cache', '-t', '${IMAGE_URI}', '.']
images:
  - '${IMAGE_URI}'
EOF
gcloud builds submit --config /tmp/_cloudbuild.yaml .
echo "✅ 建立映像成功：$IMAGE_URI"

# ✅ 檢查服務是否已存在
SERVICE_EXISTS=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(metadata.name)" 2>/dev/null || true)
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

# ✅ 重要：敏感值全部改走 Secret Manager（不再用 --set-env-vars 注入）
# - JWT_SECRET / API_KEY / GOOGLE_CLIENT_SECRET / ADMIN_API_KEY / ADMIN_CHANNEL_IDS / ECPAY_* 皆由 Secret 注入
# - 只保留「非敏感」與「環境差異」參數在 --set-env-vars
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region="$REGION" \
  --allow-unauthenticated \
  $NO_TRAFFIC_FLAG \
  --update-secrets "JWT_SECRET=${JWT_SECRET_NAME}:latest,API_KEY=${API_KEY_SECRET_NAME}:latest,GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET_NAME}:latest,ADMIN_API_KEY=${ADMIN_API_KEY_SECRET_NAME}:latest,ADMIN_CHANNEL_IDS=${ADMIN_CHANNEL_IDS_SECRET_NAME}:latest,ECPAY_MERCHANT_ID=${ECPAY_MERCHANT_ID_SECRET_NAME}:latest,ECPAY_HASH_KEY=${ECPAY_HASH_KEY_SECRET_NAME}:latest,ECPAY_HASH_IV=${ECPAY_HASH_IV_SECRET_NAME}:latest" \
  --set-env-vars "^@@^INPUT_CHANNEL=${INPUT_CHANNEL}@@GOOGLE_CLOUD_PROJECT=${PROJECT_ID}@@GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}@@GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}@@FRONTEND_BASE_URL=${FRONTEND_BASE_URL}@@ALLOWED_ORIGINS=${ALLOWED_ORIGINS}@@WEBSUB_CALLBACK_URL=${WEBSUB_CALLBACK_URL}@@FIRESTORE_DATABASE=${FIRESTORE_DATABASE}"

echo "✅ 部署指令完成"

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
