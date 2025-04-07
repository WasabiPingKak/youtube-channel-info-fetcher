from flask import Flask, jsonify
from youtube_fetcher import get_video_data

app = Flask(__name__)

@app.route("/videos")
def videos():
    data = get_video_data()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
