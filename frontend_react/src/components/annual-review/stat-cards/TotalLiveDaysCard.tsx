import React from "react";
import { CalendarDays } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface TotalLiveDaysCardProps {
  days: number;
}

export default function TotalLiveDaysCard({ days }: TotalLiveDaysCardProps) {
  const averagePerWeek = days / 52;

  return (
    <StatCardWrapper delay={0}>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-muted p-3">
          <CalendarDays className="w-6 h-6 text-primary" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">總直播天數</div>
          <div className="text-3xl font-bold tracking-tight">{days} 天</div>
          <div className="text-xs text-muted-foreground">
            平均每週 {averagePerWeek.toFixed(1)} 天
          </div>
        </div>
      </div>
    </StatCardWrapper>
  );
}
