#!/bin/bash

# === 載入環境變數 ===
if [ ! -f .env.deploy ]; then
  echo "❌ 找不到 .env.deploy 檔案，請確認環境變數檔存在"
  exit 1
fi
source .env.deploy

# === 使用者可自訂區段 ===
SERVICE_NAME="youtube-api-service"
REGION="asia-east1"
KEEP_REVISIONS=5
PROJECT_ID=$(gcloud config get-value project)
IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# === 建構映像檔（Dockerfile 模式） ===
echo ""
echo "🐳 使用 Dockerfile 建構映像..."
gcloud builds submit --tag "$IMAGE_URI" .

build_status=$?
if [ $build_status -ne 0 ]; then
  echo "❌ Build 失敗，終止腳本"
  exit 1
fi

# === 部署階段 ===
echo ""
echo "🚀 部署映像至 Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --allow-unauthenticated \
  --no-traffic \
  --set-env-vars "API_KEY=$API_KEY,INPUT_CHANNEL=$INPUT_CHANNEL"

deploy_status=$?
if [ $deploy_status -ne 0 ]; then
  echo "❌ 部署失敗，終止腳本"
  exit 1
fi

# === 顯示最新 revision URL（供測試使用） ===
echo ""
echo "🌐 最新部署完成，但尚未分配流量（--no-traffic）"
LATEST_REVISION=$(gcloud run revisions list \
  --service="$SERVICE_NAME" \
  --region="$REGION" \
  --sort-by="~CREATED" \
  --limit=1 \
  --format="value(metadata.name)")

LATEST_URL=$(gcloud run revisions describe "$LATEST_REVISION" \
  --region="$REGION" \
  --format="value(status.url)")

echo "🔗 可用於測試的 URL：$LATEST_URL"

# === 可選擇切流量 ===
read -p "✅ 要將流量切換到新 revision 嗎？(y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  echo "🚦 正在切換流量到 $LATEST_REVISION..."
  gcloud run services update-traffic "$SERVICE_NAME" \
    --region "$REGION" \
    --to-revisions="$LATEST_REVISION"=100
  echo "✅ 流量已切換完畢！"
else
  echo "ℹ️ 流量尚未切換，可使用以下指令手動切換："
  echo ""
  echo "  ./set-traffic.sh $LATEST_REVISION"
  echo ""
fi

# === 清除舊 revision ===
echo ""
echo "🧹 清理舊的 Revisions，只保留最新 $KEEP_REVISIONS 個..."
revisions=$(gcloud run revisions list \
  --service="$SERVICE_NAME" \
  --region="$REGION" \
  --sort-by="~CREATED" \
  --format="value(metadata.name)")

revisions_array=($revisions)

if [ ${#revisions_array[@]} -le $KEEP_REVISIONS ]; then
  echo "✅ 無需清理，目前 revision 數量為 ${#revisions_array[@]}"
  exit 0
fi

for ((i=$KEEP_REVISIONS; i<${#revisions_array[@]}; i++)); do
  revision="${revisions_array[$i]}"
    gcloud run revisions describe "$revision" --region="$REGION" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "⛔ 刪除 revision: $revision"
    gcloud run revisions delete "$revision" --region="$REGION" --quiet
  fi
done

echo "✅ 完成部署並清除舊版本！"
