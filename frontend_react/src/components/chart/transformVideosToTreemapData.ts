// transformVideosToTreemapData.ts

import { getCategoryColor } from "./getCategoryColor";

interface VideoItem {
  videoId: string;
  publishDate: string;
  duration: number;
  matchedPairs: Array<{ main?: string; category?: string; keyword: string }>;
}

interface TreemapNode {
  name: string;
  value: number;
  videoCount: number;
  lastUpdatedDaysAgo: number;
  itemStyle: { color: string };
  children?: TreemapNode[];
}

export function transformVideosToTreemapData(videos: VideoItem[]): TreemapNode[] {
  const now = new Date();

  const grouped: Record<string, Record<string, {
    totalDuration: number;
    videoCount: number;
    lastPublished: string;
  }>> = {};

  for (const video of videos) {
    const { duration, publishDate, matchedPairs } = video;

    if (!matchedPairs || matchedPairs.length === 0) {
      // console.warn("[Treemap] 跳過無 matchedPairs 的影片", video.videoId);
      continue;
    }

    for (const pair of matchedPairs) {
      const category = pair.category ?? pair.main; // ✅ 容錯使用 main
      const keyword = pair.keyword;

      if (!category || category === "其他" || !keyword) {
        //console.warn("[Treemap] 忽略分類", { videoId: video.videoId, category, keyword });
        continue;
      }

      //console.log("[Treemap] 加入分類", { videoId: video.videoId, category, keyword });

      if (!grouped[category]) grouped[category] = {};
      if (!grouped[category][keyword]) {
        grouped[category][keyword] = {
          totalDuration: 0,
          videoCount: 0,
          lastPublished: publishDate,
        };
      }

      grouped[category][keyword].totalDuration += duration;
      grouped[category][keyword].videoCount += 1;

      const lastDate = new Date(grouped[category][keyword].lastPublished);
      if (new Date(publishDate) > lastDate) {
        grouped[category][keyword].lastPublished = publishDate;
      }
    }
  }

  const result: TreemapNode[] = [];

  for (const category in grouped) {
    const children: TreemapNode[] = [];

    for (const keyword in grouped[category]) {
      const { totalDuration, videoCount, lastPublished } = grouped[category][keyword];
      const daysAgo = Math.floor(
        (now.getTime() - new Date(lastPublished).getTime()) / (1000 * 60 * 60 * 24)
      );
      const color = getCategoryColor(category, daysAgo);

      children.push({
        name: keyword,
        value: +(totalDuration / 3600).toFixed(2),
        videoCount,
        lastUpdatedDaysAgo: daysAgo,
        itemStyle: { color },
      });
    }

    result.push({
      name: category,
      value: children.reduce((sum, c) => sum + c.value, 0),
      videoCount: children.reduce((sum, c) => sum + c.videoCount, 0),
      lastUpdatedDaysAgo: Math.min(...children.map(c => c.lastUpdatedDaysAgo)),
      itemStyle: { color: getCategoryColor(category, 0) },
      children,
    });
  }

  console.log("[Treemap] 最終轉換結果", result);
  return result;
}
