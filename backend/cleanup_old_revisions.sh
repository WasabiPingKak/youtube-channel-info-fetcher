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

# 要刪除的 revision（跳過前 N 筆）
REVISIONS_TO_DELETE=$(echo "$ALL_REVISIONS" | tail -n +"$((RESERVE_COUNT + 1))")

echo "🧹 準備刪除以下舊的 revisions："
echo "$REVISIONS_TO_DELETE"

# 確認刪除
read -p "❗確定要刪除上述 $(echo "$REVISIONS_TO_DELETE" | wc -l) 個 revisions？(y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "🚫 已取消清理。"
  exit 0
fi

# 開始刪除
echo ""
echo "🚀 開始刪除..."
for rev in $REVISIONS_TO_DELETE; do
  echo "🔴 刪除 $rev"
  gcloud run revisions delete "$rev" \
    --region="$REGION" \
    --quiet
done

echo ""
echo "✅ 清理完成。"
