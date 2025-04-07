#!/bin/bash

# 切換到 backend 目錄
cd "$(dirname "$0")"

# 建立容器映像
gcloud builds submit --tag gcr.io/yt-channel-info-456010/youtube-api-service .

# 部署至 Cloud Run
gcloud run deploy youtube-api-service \
  --image gcr.io/yt-channel-info-456010/youtube-api-service \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "API_KEY=你的API金鑰,INPUT_CHANNEL=頻道ID或@帳號"
