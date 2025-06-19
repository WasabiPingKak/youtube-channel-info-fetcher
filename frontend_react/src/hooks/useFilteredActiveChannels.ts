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
};

type UseFilteredActiveChannelsProps = {
  channels?: ActiveTimeChannel[];
};

type UseFilteredActiveChannelsResult = {
  filteredChannels: (ActiveTimeChannel & {
    matchRatio: number;
  })[];
};

export function useFilteredActiveChannels(
  data: UseFilteredActiveChannelsProps,
  selectedWeekdays: string[],
  selectedPeriods: string[]
): UseFilteredActiveChannelsResult {
  return useMemo(() => {
    if (!data?.channels) return { filteredChannels: [] };

    // 1. 將每個頻道切成 28 區塊後計算百分比
    const channelsWithRatio = data.channels.map((ch) => {
      const ratioMap: Record<string, number> = {};
      const total = ch.totalCount || 1;

      for (const day of WEEKDAYS) {
        const hours = ch.activeTime?.[day] || {};
        for (const [periodKey, hourList] of Object.entries(TIME_PERIODS)) {
          const count = hourList.reduce(
            (sum, h) => sum + (hours?.[h.toString()] || 0),
            0
          );
          const key = `${day}-${periodKey}`;
          ratioMap[key] = count / total;
        }
      }

      return {
        ...ch,
        ratioMap,
      };
    });

    // 2. 根據條件篩選加總百分比
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
          } else {
            // 沒選擇 → 全部算進來
            include = true;
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
