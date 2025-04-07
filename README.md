# youtube-channel-info-fetcher

## 🚀 後端部署到 Google Cloud Run

### 1. 進入 `backend/` 資料夾

```bash
cd backend
```
### 2. 建立容器映像並上傳到 GCR
``` bash
gcloud builds submit --tag gcr.io/[你的專案ID]/youtube-api-service .
```

### 3. 部署至 Cloud Run
``` bash
gcloud run deploy youtube-api-service \
  --image gcr.io/[你的專案ID]/youtube-api-service \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "API_KEY=[你的API金鑰],INPUT_CHANNEL=[頻道ID或@帳號]"
```
部署成功後會顯示網址，例如：
```
https://youtube-api-service-xxxxx.asia-east1.run.app
```

## 🌐 前端部署到 Firebase Hosting
### 1. 修改 API 位址

編輯 frontend/public/index.html 裡的 fetch()：
```
const apiUrl = "https://youtube-api-service-xxxxx.asia-east1.run.app/videos";
```

### 2. 部署
```bash
cd frontend
firebase deploy --only hosting
```

部署完成後會顯示 Hosting 網址，例如：
```
https://你的專案-id.web.app
```