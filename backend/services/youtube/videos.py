import logging

from googleapiclient.errors import HttpError

from utils.retry import retry_on_transient_error


@retry_on_transient_error(max_retries=3, base_delay=1.0)
def _execute_api_request(request):
    """包裝 googleapiclient request.execute()，加入 retry"""
    return request.execute()


def get_video_ids_from_playlist(youtube, playlist_id, max_pages: int | None = None):
    video_ids = []
    next_page_token = None
    page_count = 0

    logging.info(f"📥 開始抓取播放清單影片 ID：{playlist_id}")
    try:
        while True:
            request = youtube.playlistItems().list(
                part="contentDetails",
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token,
            )
            response = _execute_api_request(request)
            ids_in_page = [item["contentDetails"]["videoId"] for item in response["items"]]
            video_ids += ids_in_page
            page_count += 1

            logging.info(
                f"📄 第 {page_count} 頁：取得 {len(ids_in_page)} 筆影片 ID，目前累計：{len(video_ids)}"
            )

            if not response.get("nextPageToken"):
                break

            if max_pages is not None and page_count >= max_pages:
                logging.info(f"⛔ 已達最大頁數限制 max_pages={max_pages}，停止抓取")
                break

            next_page_token = response["nextPageToken"]

    except HttpError as e:
        logging.error(
            "🔥 [get_video_ids_from_playlist] 抓取播放清單影片 ID 發生錯誤: %s", e, exc_info=True
        )

    return video_ids


def fetch_video_details(youtube, video_ids):
    video_details = []
    logging.info(f"🔍 開始抓取 {len(video_ids)} 支影片的詳細資料")
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        try:
            request = youtube.videos().list(
                part="snippet,contentDetails,liveStreamingDetails", id=",".join(batch)
            )
            response = _execute_api_request(request)
            video_details.extend(response["items"])
            logging.info(
                f"✅ 抓取影片詳情成功（第 {i // 50 + 1} 批，共 {len(response['items'])} 筆）"
            )
        except HttpError as e:
            logging.error(
                "🔥 [fetch_video_details] 第 %d 批次抓取失敗 (IDs: %s): %s",
                i // 50 + 1,
                batch,
                e,
                exc_info=True,
            )
    return video_details
