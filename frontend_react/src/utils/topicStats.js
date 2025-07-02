// utils/topicStats.js
import { getBadgesFromLiveChannel } from "./badgeUtils";

/**
 * 計算各主題的頻道統計數量
 * @param {Array} channels - 頻道列表
 * @returns {Object} 例如：{ 雜談: 3, 遊戲: 2, ... }
 */
export function getLiveTopicStats(channels) {
  const stats = {};
  const seen = {}; // topic => Set(channelId) 用於去重

  for (const ch of channels) {
    try {
      const channelId = ch.channelId || ch.channel_id;
      const live = ch?.live;

      if (!live || !channelId) {
        console.warn("[getLiveTopicStats] ⛔ 缺少 live 或 channelId，跳過", ch);
        continue;
      }

      const { isUpcoming, endTime } = live;
      const isLiveOrUpcoming = isUpcoming || !endTime;

      if (!isLiveOrUpcoming) {
        console.log(`[getLiveTopicStats] ⏭️ 非即將或直播中（跳過）: ${channelId}`);
        continue;
      }

      const badges = getBadgesFromLiveChannel(ch);
      const badgeTopics = badges.map((b) => b.main);
      const uniqueTopics = new Set(badgeTopics);

      for (const topic of uniqueTopics) {
        if (!seen[topic]) seen[topic] = new Set();
        if (!seen[topic].has(channelId)) {
          seen[topic].add(channelId);
          stats[topic] = (stats[topic] || 0) + 1;
        }
      }
    } catch (error) {
      console.error("[getLiveTopicStats] ❌ 錯誤:", error, ch);
    }
  }

  return stats;
}
