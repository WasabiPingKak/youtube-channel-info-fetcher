FROM python:3.11-slim

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY services/firestore/config/default_config.json ./services/config/default_config.json

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "8", "--timeout", "120", "app:app"]
