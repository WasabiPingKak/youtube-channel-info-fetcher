export interface ChartDataEntry {
  date: string;
  [game: string]: number | string;
}

export const accumulateChartData = (
  videoCountByGameAndDate: Record<string, Record<string, number>>,
  gameList: string[]
): ChartDataEntry[] => {
  // 先取得所有日期，並排序
  const allDatesSet = new Set<string>();
  for (const game of gameList) {
    Object.keys(videoCountByGameAndDate[game] || {}).forEach((d) =>
      allDatesSet.add(d)
    );
  }
  const sortedDates = Array.from(allDatesSet).sort();

  const result: ChartDataEntry[] = [];
  const accumulator: Record<string, number> = {};

  for (const date of sortedDates) {
    const entry: ChartDataEntry = { date };
    for (const game of gameList) {
      const dailyCount = videoCountByGameAndDate[game]?.[date] || 0;
      const prev = accumulator[game] || 0;
      const total = prev + dailyCount;
      accumulator[game] = total;
      entry[game] = total;
    }
    result.push(entry);
  }

  return result;
};
