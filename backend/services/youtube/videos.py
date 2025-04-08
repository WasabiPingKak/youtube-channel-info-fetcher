import logging

def get_video_ids_from_playlist(youtube, playlist_id):
    video_ids = []
    next_page_token = None
    logging.info(f"📥 開始抓取播放清單影片 ID：{playlist_id}")
    try:
        while True:
            request = youtube.playlistItems().list(
                part='contentDetails',
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token
            )
            response = request.execute()
            ids_in_page = [item['contentDetails']['videoId'] for item in response['items']]
            video_ids += ids_in_page
            logging.info(f"📄 取得 {len(ids_in_page)} 筆影片 ID，目前累計：{len(video_ids)}")
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break
    except Exception as e:
        logging.error("🔥 [get_video_ids_from_playlist] 抓取播放清單影片 ID 發生錯誤: %s", e, exc_info=True)
    return video_ids

def fetch_video_details(youtube, video_ids):
    video_details = []
    logging.info(f"🔍 開始抓取 {len(video_ids)} 支影片的詳細資料")
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        try:
            response = youtube.videos().list(
                part='snippet,contentDetails,liveStreamingDetails',
                id=','.join(batch)
            ).execute()
            video_details.extend(response['items'])
            logging.info(f"✅ 抓取影片詳情成功（第 {i//50 + 1} 批，共 {len(response['items'])} 筆）")
        except Exception as e:
            logging.error("🔥 [fetch_video_details] 第 %d 批次抓取失敗 (IDs: %s): %s", i//50 + 1, batch, e, exc_info=True)
    return video_details
