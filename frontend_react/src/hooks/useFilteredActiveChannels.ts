import { useMemo } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_PERIODS = {
  midnight: [0, 1, 2, 3, 4, 5],        // 凌晨
  morning: [6, 7, 8, 9, 10, 11],       // 早上
  afternoon: [12, 13, 14, 15, 16, 17], // 下午
  evening: [18, 19, 20, 21, 22, 23],   // 晚上
} as const;

type ActiveTimeMatrix = Record<string, Record<string, number>>;

type ActiveTimeChannel = {
  channelId: string;
  name: string;
  thumbnail: string;
  countryCode?: string[];
  activeTime: ActiveTimeMatrix;
  totalCount: number;
  enabled?: boolean;
  lastVideoUploadedAt?: string; // ISO 字串
};

type UseFilteredActiveChannelsProps = {
  channels?: ActiveTimeChannel[];
};

type UseFilteredActiveChannelsResult = {
  filteredChannels: (ActiveTimeChannel & {
    matchRatio: number;
  })[];
};

function getHeatScore(count: number, max: number): number {
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio === 0) return 0;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.7) return 3;
  return 4;
}

export function useFilteredActiveChannels(
  data: UseFilteredActiveChannelsProps,
  selectedWeekdays: string[],
  selectedPeriods: string[]
): UseFilteredActiveChannelsResult {
  return useMemo(() => {
    if (!data?.channels) return { filteredChannels: [] };

    // ✅ 過濾掉 disabled 的頻道
    const validChannels = data.channels.filter((ch) => ch.enabled !== false);

    // ✅ 無篩選條件時，用最後上片時間排序
    const noFilter = selectedWeekdays.length === 0 && selectedPeriods.length === 0;

    if (noFilter) {
      const sorted = validChannels
        .filter((ch) => ch.lastVideoUploadedAt)
        .sort((a, b) =>
          (b.lastVideoUploadedAt || "").localeCompare(a.lastVideoUploadedAt || "")
        )
        .map((ch) => ({ ...ch, matchRatio: 1 }));
      return { filteredChannels: sorted };
    }

    const channelsWithRatio = validChannels.map((ch) => {
      const ratioMap: Record<string, number> = {};

      let maxCount = 0;
      for (const day of WEEKDAYS) {
        const hours = ch.activeTime?.[day] || {};
        for (const h of Object.keys(hours)) {
          const v = hours[h];
          if (v > maxCount) maxCount = v;
        }
      }

      for (const day of WEEKDAYS) {
        const hours = ch.activeTime?.[day] || {};
        for (const [periodKey, hourList] of Object.entries(TIME_PERIODS)) {
          const scoreSum = hourList.reduce((sum, h) => {
            const count = hours?.[h.toString()] || 0;
            return sum + getHeatScore(count, maxCount);
          }, 0);

          const key = `${day}-${periodKey}`;
          ratioMap[key] = scoreSum;
        }
      }

      return {
        ...ch,
        ratioMap,
      };
    });

    const filtered = channelsWithRatio
      .map((ch) => {
        let match = 0;

        for (const key in ch.ratioMap) {
          const [day, period] = key.split("-");

          const dayMatch = selectedWeekdays.includes(day);
          const periodMatch = selectedPeriods.includes(period);

          let include = false;

          if (selectedWeekdays.length > 0 && selectedPeriods.length > 0) {
            // 同時選：交集
            include = dayMatch && periodMatch;
          } else if (selectedWeekdays.length > 0) {
            // 只選星期
            include = dayMatch;
          } else if (selectedPeriods.length > 0) {
            // 只選時段
            include = periodMatch;
          }

          if (include) match += ch.ratioMap[key];
        }

        return {
          ...ch,
          matchRatio: match,
        };
      })
      .filter((ch) => ch.matchRatio > 0)
      .sort((a, b) => b.matchRatio - a.matchRatio);

    return { filteredChannels: filtered };
  }, [data, selectedWeekdays, selectedPeriods]);
}
