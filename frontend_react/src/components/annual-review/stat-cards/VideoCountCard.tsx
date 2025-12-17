import React from "react";
import { Film } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface VideoCountCardProps {
  counts: {
    shorts: number;
    videos: number;
    live: number;
  };
}

const LABELS = [
  { key: "live", label: "直播", color: "#ef4444" },   // 紅色
  { key: "videos", label: "影片", color: "#60a5fa" }, // 藍色
  { key: "shorts", label: "Shorts", color: "#f472b6" } // 粉紅
];

export default function VideoCountCard({ counts }: VideoCountCardProps) {
  return (
    <StatCardWrapper delay={0.05}>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-muted p-3">
          <Film className="w-6 h-6 text-primary" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">影片數量</div>
          <ul className="space-y-1">
            {LABELS.map(({ key, label, color }) => (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>
                  {label}：{counts[key as keyof typeof counts]} 部
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StatCardWrapper>
  );
}
