#!/bin/bash

MODE=$1
TARGET=$2

function deploy_frontend() {
  local ENV=$1

  if [[ -z "$ENV" ]]; then
    echo "❗ 請輸入要部署的前端目標環境（dev 或 prod）"
    exit 1
  fi

  if [[ "$ENV" == "prod" ]]; then
    echo "🚨 你正在部署前端正式環境 (prod)"
    URL="https://vtuber-channel-analyzer-v3.web.app"
  elif [[ "$ENV" == "dev" ]]; then
    echo "🧪 你正在部署前端開發環境 (dev)"
    URL="https://vtuber-channel-analyzer-v3-dev.web.app"
  else
    echo "❌ 無效的目標：$ENV（請輸入 dev 或 prod）"
    exit 1
  fi

  echo ""
  echo "📤 開始部署前端到 Firebase Hosting ($ENV)..."
  firebase deploy --only hosting:$ENV

  echo ""
  echo "✅ 前端部署完成！"
  echo "🔗 請前往：$URL"
}

function deploy_backend() {
  if [ ! -f backend/.env ]; then
    echo "❌ 找不到 backend/.env 檔案，請確認環境變數檔存在"
    exit 1
  fi

  pushd backend > /dev/null
  source .env

  SERVICE_NAME="youtube-api-service"
  REGION="asia-east1"
  KEEP_REVISIONS=5
  PROJECT_ID=$(gcloud config get-value project)
  IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME"

  read -p "✅ 要切換流量到新 revision 嗎？(Y/n): " confirm_switch
  confirm_switch="${confirm_switch:-y}"
  read -p "🧹 要清除舊的 Revisions，只保留最新 $KEEP_REVISIONS 個嗎？(y/N): " confirm_clean

  export CONFIRM_SWITCH="$confirm_switch"
  export CONFIRM_CLEAN="$confirm_clean"

  echo ""
  echo "🐳 使用 Dockerfile 建構映像..."
  gcloud builds submit --tag "$IMAGE_URI" .

  if [ $? -ne 0 ]; then
    echo "❌ Build 失敗，終止腳本"
    popd > /dev/null
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
    popd > /dev/null
    exit 1
  fi

  echo ""
  LATEST_REVISION=$(gcloud run revisions list \
    --service="$SERVICE_NAME" \
    --region="$REGION" \
    --sort-by="~CREATED" \
    --limit=1 \
    --format="value(metadata.name)")

  LATEST_URL=$(gcloud run revisions describe "$LATEST_REVISION" \
    --region="$REGION" \
    --format="value(status.url)")

  echo "🔗 可用於測試的後端 URL：$LATEST_URL"

  if [[ "$CONFIRM_SWITCH" =~ ^[Yy]$ ]]; then
    echo "🚦 正在切換流量到 $LATEST_REVISION..."
    gcloud run services update-traffic "$SERVICE_NAME" \
      --region "$REGION" \
      --to-revisions="$LATEST_REVISION"=100
    echo "✅ 流量已切換完畢！"
  else
    echo "ℹ️ 流量尚未切換，可手動執行：./set-traffic.sh $LATEST_REVISION"
  fi

  if [[ "$CONFIRM_CLEAN" =~ ^[Yy]$ ]]; then
    echo "🧹 正在清理舊的 Revisions..."
    revisions=$(gcloud run revisions list \
      --service="$SERVICE_NAME" \
      --region="$REGION" \
      --sort-by="~CREATED" \
      --format="value(metadata.name)")

    revisions_array=($revisions)

    if [ ${#revisions_array[@]} -le $KEEP_REVISIONS ]; then
      echo "✅ 無需清理，當前 revisions 數量為 ${#revisions_array[@]}"
    else
      for ((i=$KEEP_REVISIONS; i<${#revisions_array[@]}; i++)); do
        revision="${revisions_array[$i]}"
        echo "⛔ 刪除 revision: $revision"
        gcloud run revisions delete "$revision" --region="$REGION" --quiet
      done
      echo "✅ 完成清除舊版本"
    fi
  else
    echo "ℹ️ 略過清除舊 revisions"
  fi
  popd > /dev/null
}

# === 執行 ===
if [[ "$MODE" == "frontend" ]]; then
  deploy_frontend "$TARGET"
elif [[ "$MODE" == "backend" ]]; then
  deploy_backend
elif [[ "$MODE" == "all" ]]; then
  deploy_frontend "$TARGET"
  deploy_backend
else
  echo "❌ 無效參數"
  echo "👉 用法："
  echo "  ./deploy.sh frontend dev"
  echo "  ./deploy.sh backend"
  echo "  ./deploy.sh all prod"
  exit 1
fi
