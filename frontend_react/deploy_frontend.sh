#!/bin/bash

# ⛔ 遇到錯誤就馬上停止腳本
set -e

# --- 取得最新的 Git Commit Hash（取前6碼） ---
commit_hash=$(git rev-parse --short=6 HEAD)
echo "🔖 目前 Git Commit Hash: $commit_hash"

# --- 備份原本的 index.html ---
cp index.html index.html.bak

# --- 插入 Hash 到 <title> 中 ---
sed -i'' -E "s|(<title>[^<]*)</title>|\1 ($commit_hash)</title>|" index.html
echo "📝 已將 Commit Hash 加入到 index.html 標題"

# --- 建立正式版 build ---
echo ""
echo "📦 建立正式版（關閉 /settings 頁面）..."
VITE_ENABLE_SETTINGS=false npm run build

# --- 還原 index.html ---
mv index.html.bak index.html
echo "♻️ 已還原原本的 index.html"

# --- 部署到 Firebase Hosting ---
echo ""
echo "🚀 正在部署到 Firebase Hosting..."
output=$(firebase deploy)

# --- 顯示部署完成後的 Hosting 網址 ---
echo ""
echo "🎯 Hosting URL："
echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app'

# --- 自動打開瀏覽器（支援 Linux / Mac / Windows Git Bash）---
if command -v xdg-open > /dev/null; then
  xdg-open "$(echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app')"
elif command -v open > /dev/null; then
  open "$(echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app')"
fi

echo ""
echo "✅ 部署完成！"
