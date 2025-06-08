#!/bin/bash

# ⛔ 發生錯誤立即停止
set -e

# ✅ 判斷參數
if [ $# -eq 0 ]; then
  echo "❌ 請指定部署模式參數：--prod 或 --staging"
  exit 1
fi

MODE=""
TARGET=""

if [ "$1" == "--prod" ]; then
  MODE="production"
  TARGET="prod"
elif [ "$1" == "--staging" ]; then
  MODE="staging"
  TARGET="staging"
else
  echo "❌ 不支援的參數：$1"
  echo "請使用 --prod 或 --staging"
  exit 1
fi

# --- 取得最新的 Git Commit Hash（取前6碼） ---
commit_hash=$(git rev-parse --short=6 HEAD)
echo "🔖 目前 Git Commit Hash: $commit_hash"

# --- 備份原本的 index.html ---
cp index.html index.html.bak

# --- 若為 staging，修改 index.html 的 <title> ---
if [ "$MODE" == "staging" ]; then
  echo "🧩 替換 <title> 為『VTMap 頻道旅圖 staging』"
  sed -i'' -E 's|<title>VTMap 頻道旅圖</title>|<title>VTMap 頻道旅圖 staging</title>|' index.html
fi

# --- 插入 Git Hash 註解於 </head> 前 ---
sed -i'' -E "s|</head>|  <!-- Deployed Git Commit: $commit_hash -->\n</head>|" index.html
echo "📝 已將 Commit Hash 以註解方式加入到 index.html"

# --- 建立對應模式的 build ---
echo ""
echo "📦 建立 $MODE 版..."
npm run build -- --mode $MODE

# --- 還原 index.html ---
mv index.html.bak index.html
echo "♻️ 已還原原本的 index.html"

# --- 部署到 Firebase Hosting target ---
echo ""
echo "🚀 正在部署到 Firebase Hosting [$TARGET]..."
if ! output=$(firebase deploy --only hosting:$TARGET 2>&1); then
  echo "❌ Firebase 部署失敗："
  echo "$output"
  exit 1
fi

# --- 顯示部署完成後的 Hosting 網址 ---
echo ""
echo "🎯 Hosting URL："
echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app'

# --- 自動打開網址（支援 mac / linux / git bash）---
if command -v xdg-open > /dev/null; then
  xdg-open "$(echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app')"
elif command -v open > /dev/null; then
  open "$(echo "$output" | grep -Eo 'https://[a-zA-Z0-9.-]+\.web\.app')"
fi

echo ""
echo "✅ 部署完成！"
