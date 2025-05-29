export interface VideoItem {
  publishDate: string;
  channelId: string;
  [key: string]: any;
}

export interface TrendingRawData {
  topGames: string[];
  chartData: Array<{ date: string; [game: string]: number | string }>;
  details: {
    [game: string]: {
      [channelId: string]: VideoItem[];
    };
  };
  summaryStats: {
    [game: string]: {
      videoCount: number;
      channelCount: number;
    };
  };
  channelInfo: {
    [channelId: string]: {
      name: string;
      thumbnail: string;
      url: string;
    };
  };
}

export interface FilteredTrendingData {
  chartData: TrendingRawData["chartData"];
  topGames: string[];
  details: TrendingRawData["details"];
  summaryStats: TrendingRawData["summaryStats"];
  channelInfo: TrendingRawData["channelInfo"];
}

export function filterTrendingData(
  rawData: TrendingRawData | null,
  days: number
): FilteredTrendingData | null {
  if (!rawData) return null;

  const chartData = rawData.chartData.slice(-days); // 取近 N 天
  const cutoffDate = chartData.length > 0 ? chartData[0].date : null;

  const details: FilteredTrendingData["details"] = {};
  const summaryStats: FilteredTrendingData["summaryStats"] = {};

  for (const [game, channels] of Object.entries(rawData.details)) {
    details[game] = {};
    let totalVideos = 0;
    let channelCount = 0;

    for (const [channelId, videos] of Object.entries(channels)) {
      const filteredVideos = videos.filter(
        (v) => v.publishDate >= cutoffDate
      );
      if (filteredVideos.length > 0) {
        details[game][channelId] = filteredVideos;
        totalVideos += filteredVideos.length;
        channelCount += 1;
      }
    }

    summaryStats[game] = {
      videoCount: totalVideos,
      channelCount,
    };
  }

  // 🔁 動態重新計算 topGames（根據 chartData 中統計）
  const gameTotals: Record<string, number> = {};
  for (const entry of chartData) {
    for (const [game, count] of Object.entries(entry)) {
      if (game === "date") continue;
      gameTotals[game] = (gameTotals[game] || 0) + Number(count);
    }
  }

  const sortedTopGames = Object.entries(gameTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([game]) => game);

  return {
    chartData,
    topGames: sortedTopGames,
    details,
    summaryStats,
    channelInfo: rawData.channelInfo,
  };
}
