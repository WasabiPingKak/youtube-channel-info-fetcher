#!/bin/bash

SERVICE_NAME="youtube-api-service"
REGION="asia-east1"

echo "🔍 取得目前 revision 狀態..."

# 取得 revision 名稱與 Ready 狀態，並按時間順序排列（最新在上）
REVISIONS=$(gcloud run revisions list \
  --service="$SERVICE_NAME" \
  --region="$REGION" \
  --format="table[no-heading](METADATA.name, STATUS.conditions)" \
  | grep "True" \
  | awk '{print $1}'
)

READY_REVISION=$(echo "$REVISIONS" | head -n 1)

if [ -z "$READY_REVISION" ]; then
  echo "❌ 找不到任何 Ready 狀態的 revision"
  exit 1
fi

echo "✅ 準備切換流量至：$READY_REVISION"

gcloud run services update-traffic "$SERVICE_NAME" \
  --region="$REGION" \
  --to-revisions="$READY_REVISION=100"

if [ $? -eq 0 ]; then
  echo "🎉 流量已成功切換到 $READY_REVISION"
else
  echo "❌ 流量切換失敗"
  exit 1
fi
