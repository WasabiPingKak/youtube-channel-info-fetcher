# 使用官方 Python 映像檔
FROM python:3.10-slim

# 設定工作目錄
WORKDIR /app

# 複製檔案
COPY . .

# 安裝相依套件
RUN pip install --no-cache-dir -r requirements.txt

# 開放 Flask 預設的 8080 port
EXPOSE 8080

# 設定啟動指令
#CMD ["python", "app.py"]
CMD ["python", "app_firestore.py"]