import React, { useEffect, useState } from "react";
import { PiCompassRoseBold } from "react-icons/pi";
import { PiSunBold, PiMoonBold } from "react-icons/pi";
import SmartLink from "@/components/common/SmartLink";

const TopNav = ({ collapsed, toggleCollapsed }) => {
  const isMobile = window.innerWidth < 768;

  const handleMenuClick = () => {
    if (isMobile) {
      window.dispatchEvent(new CustomEvent("open-channel-drawer"));
    } else {
      toggleCollapsed();
    }
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // 初始化：從 localStorage 載入偏好
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

  // 切換 dark mode
  const toggleTheme = () => {
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

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 shadow z-50 flex items-center px-4">
      <button
        onClick={handleMenuClick}
        className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white mr-4"
        aria-label="切換側邊欄"
      >
        ☰
      </button>

      <SmartLink
        to="/"
        className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white"
      >
        <PiCompassRoseBold className="w-6 h-6" />
        <span>VTMap 頻道旅圖｜Vtuber TrailMap</span>
      </SmartLink>

      <div className="ml-auto">
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
          aria-label="切換主題"
        >
          {isDark ? (
            <PiSunBold className="w-5 h-5" />
          ) : (
            <PiMoonBold className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default TopNav;
