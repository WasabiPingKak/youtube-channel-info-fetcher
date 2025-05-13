#!/bin/bash

# ⚙️ 參數設定
SERVICE_NAME="youtube-api-service"
REGION="asia-east1"
RESERVE_COUNT=10

echo "📦 正在列出所有 revisions..."
ALL_REVISIONS=$(gcloud run revisions list \
  --service="$SERVICE_NAME" \
  --region="$REGION" \
  --sort-by="~createTime" \
  --format="value(NAME)")

# 檢查是否有足夠的 revisions 才執行清理
TOTAL_COUNT=$(echo "$ALL_REVISIONS" | wc -l)
if [ "$TOTAL_COUNT" -le "$RESERVE_COUNT" ]; then
  echo "✅ 總數 $TOTAL_COUNT 小於等於保留數 $RESERVE_COUNT，不需清理。"
  exit 0
fi

# 要刪除的 revision（跳過前 N 筆），同時清除換行與潛在 \r 字元
REVISIONS_TO_DELETE=$(echo "$ALL_REVISIONS" | tail -n +"$((RESERVE_COUNT + 1))" | tr -d '\r')

DELETE_COUNT=$(echo "$REVISIONS_TO_DELETE" | grep -c .)
echo "🧹 將刪除 $DELETE_COUNT 個舊的 revisions："
echo "$REVISIONS_TO_DELETE"

# 開始刪除
echo ""
echo "🚀 開始刪除..."
echo "$REVISIONS_TO_DELETE" | while IFS= read -r rev; do
  rev=$(echo "$rev" | tr -d '\r')  # 清除 CR
  if [ -n "$rev" ]; then
    echo "🔴 刪除 $rev"
    gcloud run revisions delete "$rev" \
      --region="$REGION" \
      --quiet
  fi
done

echo ""
echo "✅ 清理完成。"
