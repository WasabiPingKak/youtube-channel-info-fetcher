import React, { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "react-router-dom";
import { PiSunBold, PiMoonBold } from "react-icons/pi";
import { FaUserCog, FaAddressCard, FaRegCalendarAlt } from "react-icons/fa";
import { IoFileTrayFull } from "react-icons/io5";
import { useUnlockScroll } from "@/hooks/useUnlockScroll";

const AvatarDropdown = ({ channelId, channelName, avatarUrl }) => {
  useUnlockScroll();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  // 初始化主題
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-zinc-700"
          aria-label="使用者選單"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700 text-sm text-gray-600 dark:text-gray-300">
              {channelName?.charAt(0) || "?"}
            </div>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          portalled={false}
          sideOffset={8}
          className="w-64 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-1 z-[9999]"
        >
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            {channelName || "不明頻道"}
          </div>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer rounded"
            onSelect={() => navigate(`/videos?channel=${channelId}`)}
          >
            <FaAddressCard className="w-4 h-4" />
            <span>我的頻道分析</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer rounded"
            onSelect={() => navigate("/my-settings")}
          >
            <FaUserCog className="w-4 h-4" />
            <span>頻道設定</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer rounded"
            onSelect={() => navigate(`/quick-category-editor/${channelId}`)}
          >
            <IoFileTrayFull className="w-4 h-4" />
            <span>自訂影片分類｜快速模式</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer rounded"
            onSelect={() => navigate("/my-category-editor")}
          >
            <IoFileTrayFull className="w-4 h-4" />
            <span>自訂影片分類｜進階模式</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 border-t border-gray-200 dark:border-zinc-700" />

          {/* ✅ 2025年度回顧 */}
          {channelId && (
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer rounded"
              onSelect={() => navigate(`/review/${channelId}/2025`)}
            >
              <FaRegCalendarAlt className="w-4 h-4" />
              <span>2025 年度回顧</span>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 border-t border-gray-200 dark:border-zinc-700" />

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
            onSelect={toggleTheme}
          >
            {isDark ? (
              <PiSunBold className="w-4 h-4" />
            ) : (
              <PiMoonBold className="w-4 h-4" />
            )}
            切換深色模式
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default AvatarDropdown;
