import os
import logging
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ✅ 設定 log 格式
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# ✅ 載入 .env 檔案
load_dotenv()
API_KEY = os.getenv("API_KEY")
INPUT_CHANNEL = os.getenv("INPUT_CHANNEL")

# ✅ 驗證 API_KEY 與 INPUT_CHANNEL
if not API_KEY or not INPUT_CHANNEL:
    raise EnvironmentError("❌ 請在 .env 中正確設定 API_KEY 與 INPUT_CHANNEL")

# ✅ 初始化 YouTube API client（與主程式相同邏輯，強制禁用 cache）
def get_youtube_service(api_key):
    try:
        return build("youtube", "v3", developerKey=api_key, cache_discovery=False)
    except Exception as e:
        logging.error("🔥 [get_youtube_service] 建立 YouTube API 服務失敗: %s", e, exc_info=True)
        return None

def get_channel_id(youtube, input_channel):
    if input_channel.startswith("UC"):
        return input_channel
    username = input_channel[1:] if input_channel.startswith("@") else input_channel
    try:
        response = youtube.search().list(
            part="snippet",
            q=username,
            type="channel",
            maxResults=1
        ).execute()
        if response["items"]:
            return response["items"][0]["snippet"]["channelId"]
        else:
            logging.warning("⚠️ 找不到頻道: %s", input_channel)
            return None
    except HttpError as err:
        logging.error("🔥 [get_channel_id] HTTP 錯誤: %s", err, exc_info=True)
        return None
    except Exception as e:
        logging.error("🔥 [get_channel_id] 其他錯誤: %s", e, exc_info=True)
        return None

def get_uploads_playlist_id(youtube, channel_id):
    try:
        response = youtube.channels().list(part="contentDetails", id=channel_id).execute()
        items = response.get("items", [])
        if not items:
            logging.warning("⚠️ 找不到頻道內容，頻道 ID: %s", channel_id)
            return None
        return items[0]['contentDetails']['relatedPlaylists']['uploads']
    except Exception as e:
        logging.error("🔥 [get_uploads_playlist_id] 錯誤: %s", e, exc_info=True)
        return None

def get_video_ids_from_playlist(youtube, playlist_id, max_results=10):
    video_ids = []
    next_page_token = None
    try:
        while len(video_ids) < max_results:
            request = youtube.playlistItems().list(
                part='contentDetails',
                playlistId=playlist_id,
                maxResults=min(50, max_results - len(video_ids)),
                pageToken=next_page_token
            )
            response = request.execute()
            ids_in_page = [item['contentDetails']['videoId'] for item in response['items']]
            video_ids += ids_in_page
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break
    except Exception as e:
        logging.error("🔥 [get_video_ids_from_playlist] 錯誤: %s", e, exc_info=True)
    return video_ids

def fetch_video_details(youtube, video_ids):
    video_details = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        try:
            response = youtube.videos().list(
                part='snippet,contentDetails',
                id=','.join(batch)
            ).execute()
            video_details.extend(response['items'])
        except Exception as e:
            logging.error("🔥 [fetch_video_details] 批次失敗 (IDs: %s): %s", batch, e, exc_info=True)
    return video_details

def main():
    youtube = get_youtube_service(API_KEY)
    if youtube is None:
        return

    channel_id = get_channel_id(youtube, INPUT_CHANNEL)
    if not channel_id:
        return

    playlist_id = get_uploads_playlist_id(youtube, channel_id)
    if not playlist_id:
        return

    video_ids = get_video_ids_from_playlist(youtube, playlist_id, max_results=10)
    if not video_ids:
        return

    video_details = fetch_video_details(youtube, video_ids)
    for v in video_details:
        try:
            title = v["snippet"]["title"]
            vid = v["id"]
            published = v["snippet"]["publishedAt"]
            duration = v["contentDetails"]["duration"]
            print(f"[{published}] {title} (ID: {vid}) → 時長：{duration}")
        except Exception as e:
            logging.error("🔥 無法解析影片資訊: %s", e, exc_info=True)

if __name__ == "__main__":
    main()
