from flask import Flask, jsonify
from flask_cors import CORS
from youtube_fetcher import get_video_data
import os

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return "✅ YouTube API Service is running. Visit /videos to get data."

@app.route("/videos")
def videos():
    data = get_video_data()
    return jsonify(data)

if __name__ == "__main__":
    print("✅ Flask app is starting...")
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)  # ✅ 必須監聽 0.0.0.0 才能被 Cloud Run 訪問
