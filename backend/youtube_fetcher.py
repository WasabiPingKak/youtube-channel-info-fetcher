import os
import datetime
import pytz
import isodate
import googleapiclient.discovery
import googleapiclient.errors

API_KEY = os.getenv("API_KEY")
INPUT_CHANNEL = os.getenv("INPUT_CHANNEL")

# 🎥 設定 API 服務
def get_youtube_service():
    return googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)


# 🎥 根據 @帳號 或 channelId 傳回正確的 channelId
def get_channel_id(youtube, input_channel):
    if input_channel.startswith("UC"):
        return input_channel
    # Will increase API query, NOT recommend
    if input_channel.startswith("@"):
        username = input_channel[1:]
    else:
        username = input_channel

    try:
        response = youtube.search().list(part="snippet", q=username, type="channel", maxResults=1).execute()
        if response["items"]:
            return response["items"][0]["snippet"]["channelId"]
        else:
            print("❌ 找不到頻道")
            return None
    except googleapiclient.errors.HttpError as err:
        print(f"HTTP Error: {err}")
        return None


# 🎥 取得頻道上傳影片清單 ID
def get_uploads_playlist_id(youtube, channel_id):
    try:
        response = youtube.channels().list(part="contentDetails", id=channel_id).execute()
        return response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
    except Exception as e:
        print(f"Error getting uploads playlist: {e}")
        return None


# 🎥 取得播放清單中所有影片 ID
def get_video_ids_from_playlist(youtube, playlist_id):
    video_ids = []
    next_page_token = None
    while True:
        request = youtube.playlistItems().list(
            part='contentDetails',
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()
        video_ids += [item['contentDetails']['videoId'] for item in response['items']]
        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break
    return video_ids


# 🎥 批次取得影片詳細資料
def fetch_video_details(youtube, video_ids):
    video_details = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        try:
            response = youtube.videos().list(
                part='snippet,contentDetails,liveStreamingDetails',
                id=','.join(batch)
            ).execute()
            video_details.extend(response['items'])
        except Exception as e:
            print(f"Error fetching video details: {e}")
    return video_details


# 🎥 轉換影片長度為 HH:MM:SS 並取得總分鐘數
def convert_duration_to_hms(duration):
    parsed = isodate.parse_duration(duration)
    total_seconds = int(parsed.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    total_minutes = (hours * 60) + minutes + (seconds / 60)
    total_minutes = round(total_minutes, 1) if total_minutes < 1 else int(total_minutes)
    return f"{hours:02}:{minutes:02}:{seconds:02}", total_minutes


# 🎥 取得發布日期與星期
def get_video_publish_date(video):
    dt = datetime.datetime.fromisoformat(video['snippet']['publishedAt'][:-1])
    local_dt = dt.astimezone(pytz.timezone("Asia/Taipei"))
    #weekdays = ['一', '二', '三', '四', '五', '六', '日']
    #return local_dt.strftime(f"%Y/%m/%d ({weekdays[local_dt.weekday()]})")
    return local_dt.strftime(f"%Y/%m/%d")


# 🎥 判斷影片類型：影片、Shorts 或直播檔
def get_video_type(video):
    if 'liveStreamingDetails' in video and 'actualEndTime' in video['liveStreamingDetails']:
        return "直播檔"
    if video['snippet'].get('liveBroadcastContent') == 'upcoming':
        return None
    duration_minutes = convert_duration_to_hms(video['contentDetails']['duration'])[1]
    if duration_minutes <= 1:
        return "Shorts"
    return "影片"


# 新增這個函式，把 main() 的邏輯包進來
def get_video_data(date_ranges=None):
    youtube = get_youtube_service()
    channel_id = get_channel_id(youtube, INPUT_CHANNEL)
    playlist_id = get_uploads_playlist_id(youtube, channel_id)
    video_ids = get_video_ids_from_playlist(youtube, playlist_id)
    all_videos = fetch_video_details(youtube, video_ids)

    results = []
    for video in all_videos:
        video_type = get_video_type(video)
        if not video_type:
            continue

        published_dt = datetime.datetime.fromisoformat(video['snippet']['publishedAt'][:-1]).astimezone(pytz.timezone("Asia/Taipei"))
        if date_ranges and not any(start <= published_dt < end for start, end in date_ranges):
            continue

        duration_text, total_minutes = convert_duration_to_hms(video['contentDetails']['duration'])
        title = video['snippet']['title']
        video_id = video['id']
        date_text = get_video_publish_date(video)

        category = None
        if "【" in title and "】" in title:
            category = title.split("【")[1].split("】")[0]

        results.append({
            "標題": title,
            "影片ID": video_id,
            "發布日期": date_text,
            "影片時長": duration_text,
            "總分鐘數": total_minutes,
            "類別": category or "無",
            "影片類型": video_type
        })

    return results  # 不寫檔案，直接回傳資料