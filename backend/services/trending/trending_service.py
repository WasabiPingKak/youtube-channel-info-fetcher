import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from google.cloud.firestore import Client
from services.trending.channel_info_loader import load_channel_info_index

logger = logging.getLogger(__name__)

def get_trending_games_summary(db: Client) -> Dict[str, Any]:
    """
    從 Firestore trending_games_daily/{YYYY-MM-DD} 讀取過去 30 天資料，
    整理出各遊戲的影片成長趨勢與頻道活躍資料。

    回傳格式如下：
    {
        "topGames": List[str],
            # 排名前 10 的熱門遊戲名稱（依影片總數排序）

        "chartData": List[Dict[str, Union[str, int]]],
            # 每日影片數統計資料，用於折線圖繪製
            # 格式範例：
            # [
            #   { "date": "2025-05-01", "Minecraft": 4, "FF14": 2, ... },
            #   ...
            # ]

        "details": Dict[str, Dict[str, List[VideoItem]]],
            # 每個遊戲對應頻道的影片清單（已排序，新 → 舊）
            # e.g. details["Minecraft"]["UCxxxx"] = [VideoItem, VideoItem, ...]

        "summaryStats": Dict[str, Dict[str, int]],
            # 每個遊戲的統計數據
            # 格式：{ "Minecraft": { "videoCount": 123, "channelCount": 40 }, ... }

        "channelInfo": Dict[str, Dict[str, str]],
            # 每個頻道的基本資訊，供前端渲染 ChannelCard
            # 格式：
            # {
            #   "UCxxxxx": {
            #       "name": "頻道名稱",
            #       "thumbnail": "https://...",
            #       "url": "https://www.youtube.com/channel/UCxxxxx"
            #   },
            #   ...
            # }
    }
    """
    try:
        today = datetime.now(timezone.utc).date()
        dates = [(today - timedelta(days=i)).isoformat() for i in range(1, 31)]
        logger.info(f"📅 準備讀取過去 30 天完整資料：{dates[-1]} ～ {dates[0]}")

        game_stats: Dict[str, Dict[str, int]] = {}
        game_videos: Dict[str, List[dict]] = {}
        channel_info = load_channel_info_index(db)
        logger.info(f"📡 已載入頻道資訊，共 {len(channel_info)} 筆")

        for date_str in dates:
            doc_ref = db.collection("trending_games_daily").document(date_str)
            doc = doc_ref.get()
            if not doc.exists:
                logger.info(f"⚠️ 找不到日期 {date_str} 的快取資料，略過")
                continue

            data = doc.to_dict()
            logger.info(f"📁 讀取 {date_str}，共 {len(data)} 款遊戲")
            for game, videos in data.items():
                if not isinstance(videos, list):
                    continue
                game_stats.setdefault(game, {})[date_str] = len(videos)
                game_videos.setdefault(game, []).extend(videos)

        logger.info(f"📊 完成彙總遊戲資料，共發現 {len(game_stats)} 款遊戲")

        top_games = sorted(
            game_stats.items(),
            key=lambda item: sum(item[1].values()),
            reverse=True
        )[:10]
        top_game_names = [g for g, _ in top_games]
        logger.info(f"🏆 熱門遊戲 Top 10：{top_game_names}")

        # 折線圖資料
        chart_data: List[Dict[str, Any]] = []
        for date_str in sorted(dates):  # 由舊到新
            entry = {"date": date_str}
            for game in top_game_names:
                entry[game] = game_stats.get(game, {}).get(date_str, 0)
            chart_data.append(entry)

        # 更新 details 結構 → game → channelId → List[影片]
        details: Dict[str, Dict[str, List[dict]]] = {}
        summary_stats: Dict[str, Dict[str, int]] = {}

        for game in top_game_names:
            per_channel: Dict[str, List[dict]] = {}
            total_videos = 0

            for v in game_videos.get(game, []):
                cid = v.get("channelId")
                ts = v.get("publishDate")
                if not cid or not ts:
                    continue
                per_channel.setdefault(cid, []).append(v)
                total_videos += 1

            # 每個頻道內部影片排序（新→舊）
            for videos in per_channel.values():
                videos.sort(key=lambda v: v["publishDate"], reverse=True)

            details[game] = per_channel
            summary_stats[game] = {
                "videoCount": total_videos,
                "channelCount": len(per_channel),
            }
            logger.info(f"📦 {game} 頻道數={len(per_channel)}，影片數={total_videos}")

        logger.info("✅ trending_games_summary 統整完成")
        return {
            "topGames": top_game_names,
            "chartData": chart_data,
            "details": details,
            "summaryStats": summary_stats,
            "channelInfo": channel_info,
        }

    except Exception as e:
        logger.error("🔥 無法產生 trending_games_summary", exc_info=True)
        return {"error": str(e)}
