import React, { useEffect, useState } from "react";
import { PiCompassRoseBold, PiSunBold, PiMoonBold } from "react-icons/pi";
import SmartLink from "@/components/common/SmartLink";
import UserMenu from "@/components/common/UserMenu";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMyChannelId } from "@/hooks/useMyChannelId";

const TopNav = ({ collapsed, toggleCollapsed }) => {
  const isMobile = useIsMobile();
  const { data: user } = useMyChannelId();
  const isLoggedIn = !!user?.channelId;

  const handleMenuClick = () => {
    if (isMobile) {
      window.dispatchEvent(new CustomEvent("open-channel-drawer"));
    } else {
      toggleCollapsed();
    }
  };

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
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

      <div className="ml-auto flex items-center gap-2">
        {!isLoggedIn && (
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
            aria-label="切換主題"
          >
            {isDark ? <PiSunBold className="w-5 h-5" /> : <PiMoonBold className="w-5 h-5" />}
          </button>
        )}
        <UserMenu />
      </div>
    </header>
  );
};

export default TopNav;
