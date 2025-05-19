export interface ChartDataEntry {
    date: string;
    [game: string]: number | string;
  }

  export const accumulateChartData = (
    chartData: ChartDataEntry[],
    topGames: string[]
  ): ChartDataEntry[] => {
    const result: ChartDataEntry[] = [];
    const accumulator: Record<string, number> = {};

    chartData.forEach((entry) => {
      const newEntry: ChartDataEntry = { date: entry.date };
      topGames.forEach((game) => {
        const prev = accumulator[game] || 0;
        const current = Number(entry[game] || 0);
        const total = prev + current;
        accumulator[game] = total;
        newEntry[game] = total;
      });
      result.push(newEntry);
    });

    return result;
  };
