#!/bin/bash

set -e

echo "📦 Building project with Vite..."
npm run build

echo ""
echo "🚀 Deploying to Firebase Hosting..."
output=$(firebase deploy)

echo ""
echo "🎯 Hosting URL："
echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app'

# ✅ 自動開啟預設瀏覽器（可選，支援 Mac / Linux / Windows Git Bash）
if command -v xdg-open > /dev/null; then
  xdg-open "$(echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app')"
elif command -v open > /dev/null; then
  open "$(echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app')"
fi

echo ""
echo "✅ 完成！"
