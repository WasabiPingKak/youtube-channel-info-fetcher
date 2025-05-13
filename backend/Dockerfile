FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY services/firestore/config/default_config.json ./services/config/default_config.json

EXPOSE 8080

CMD ["python", "app.py"]
