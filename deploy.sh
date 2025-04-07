#!/bin/bash

TARGET=$1

if [[ -z "$TARGET" ]]; then
  echo "❗ 請輸入要部署的目標（dev 或 prod）"
  echo "👉 用法： ./deploy.sh dev"
  exit 1
fi

if [[ "$TARGET" == "prod" ]]; then
  echo "🚨 你正在部署正式環境 (prod)"
  URL="https://yt-channel-info-456010.web.app"
elif [[ "$TARGET" == "dev" ]]; then
  echo "🧪 你正在部署開發環境 (dev)"
  URL="https://yt-channel-info-456010-dev.web.app"
else
  echo "❌ 無效的目標：$TARGET（請輸入 dev 或 prod）"
  exit 1
fi

echo ""
echo "📤 開始部署到 Firebase Hosting ($TARGET)..."
firebase deploy --only hosting:$TARGET

echo ""
echo "✅ 部署完成！"
echo "🔗 請前往：$URL"
