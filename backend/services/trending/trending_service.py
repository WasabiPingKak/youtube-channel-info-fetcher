import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from google.cloud.firestore import Client

logger = logging.getLogger(__name__)

def get_trending_games_summary(db: Client) -> Dict[str, Any]:
    """
    讀取 Firestore 中最近 30 天的 trending_games_daily 快取資料，
    回傳：
    - chartData：每日影片數（給折線圖用）
    - topGames：影片總數前 10 名的遊戲名
    - details：每個遊戲中每個頻道的最新影片
    """
    try:
        today = datetime.now(timezone.utc).date()
        dates = [(today - timedelta(days=i)).isoformat() for i in range(1, 31)]
        logger.info(f"📅 準備讀取最近 30 天快取資料：{dates[0]} ～ {dates[-1]}")

        game_stats: Dict[str, Dict[str, int]] = {}
        game_videos: Dict[str, List[dict]] = {}

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

        chart_data: List[Dict[str, Any]] = []
        for date_str in sorted(dates):  # 由舊到新
            entry = {"date": date_str}
            for game in top_game_names:
                entry[game] = game_stats.get(game, {}).get(date_str, 0)
            chart_data.append(entry)

        details: Dict[str, List[dict]] = {}
        for game in top_game_names:
            latest_per_channel: Dict[str, dict] = {}
            for v in game_videos.get(game, []):
                cid = v.get("channelId")
                ts = v.get("publishDate")
                if not cid or not ts:
                    continue
                prev = latest_per_channel.get(cid)
                if not prev or ts > prev["publishDate"]:
                    latest_per_channel[cid] = v
            sorted_videos = sorted(
                latest_per_channel.values(),
                key=lambda v: v["publishDate"],
                reverse=True
            )
            logger.info(f"📦 {game} 頻道數：{len(sorted_videos)}")
            details[game] = sorted_videos

        logger.info("✅ trending_games_summary 統整完成")
        return {
            "topGames": top_game_names,
            "chartData": chart_data,
            "details": details,
        }

    except Exception as e:
        logger.error("🔥 無法產生 trending_games_summary", exc_info=True)
        return {"error": str(e)}
