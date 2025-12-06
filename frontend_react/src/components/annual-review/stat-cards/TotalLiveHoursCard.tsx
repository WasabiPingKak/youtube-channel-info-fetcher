import React from "react";
import { Clock } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface TotalLiveHoursCardProps {
  hours: number;
}

export default function TotalLiveHoursCard({ hours }: TotalLiveHoursCardProps) {
  const averagePerWeek = hours / 52;

  return (
    <StatCardWrapper delay={0}>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-muted p-3">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">總直播時數</div>
          <div className="text-3xl font-bold tracking-tight">
            {hours.toFixed(1)} 小時
          </div>
          <div className="text-xs text-muted-foreground">
            平均每週 {averagePerWeek.toFixed(1)} 小時
          </div>
        </div>
      </div>
    </StatCardWrapper>
  );
}

