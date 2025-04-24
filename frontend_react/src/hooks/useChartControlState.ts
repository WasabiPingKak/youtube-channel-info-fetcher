import { useState } from "react";

export type ChartType = "pie" | "bar";
export type DurationUnit = "hours" | "minutes";

export const useChartControlState = () => {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("hours");

  return {
    chartType,
    setChartType,
    durationUnit,
    setDurationUnit,
  };
};
