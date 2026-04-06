import React from "react";
import { BarChart3, PlaySquare, Clock } from "lucide-react";

export type ChannelTab = "overview" | "videos" | "heatmap";

interface ChannelPageTabsProps {
    activeTab: ChannelTab;
    onTabChange: (tab: ChannelTab) => void;
}

const tabs: { key: ChannelTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "總覽", icon: <BarChart3 size={16} /> },
    { key: "videos", label: "影片", icon: <PlaySquare size={16} /> },
    { key: "heatmap", label: "活躍時段", icon: <Clock size={16} /> },
];

const ChannelPageTabs = ({ activeTab, onTabChange }: ChannelPageTabsProps) => {
    return (
        <div className="border-b border-gray-200 dark:border-zinc-700">
            <nav className="flex gap-6 px-4" aria-label="頻道頁籤">
                {tabs.map(({ key, label, icon }) => {
                    const isActive = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => onTabChange(key)}
                            className={`
                                flex items-center gap-1.5 py-3 text-sm font-medium
                                border-b-2 transition-colors
                                ${isActive
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                                }
                            `}
                        >
                            {icon}
                            {label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default ChannelPageTabs;
