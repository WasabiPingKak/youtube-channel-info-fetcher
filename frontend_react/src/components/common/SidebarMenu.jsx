import { useNavigate } from "react-router-dom";
import {
  FaYoutube, FaTwitter, FaUser, FaGithub,
  FaChartLine, FaClipboardList, FaTools, FaUserCog
} from "react-icons/fa";
import { PiAirplaneLandingFill } from "react-icons/pi";
import { MdPrivacyTip } from "react-icons/md";
import { IoFileTrayFull } from "react-icons/io5";
import clsx from "clsx";
import { useMyChannelId } from "@/hooks/useMyChannelId";
import SmartLink from "@/components/common/SmartLink";

const SidebarMenu = ({ collapsed, setCollapsed, isMobile = false, onItemClick }) => {
  const navigate = useNavigate();
  const { data: user } = useMyChannelId();

  const isLoggedIn = !!user?.channelId;

  const menuItems = [
    {
      label: "降落轉機塔臺",
      icon: <PiAirplaneLandingFill className="w-5 h-5" />,
      to: "/live-redirect",
    },
    {
      label: "頻道遊戲趨勢",
      icon: <FaChartLine className="w-5 h-5" />,
      to: "/trending",
    },
    {
      label: "檢視所有頻道",
      icon: <FaUser className="w-5 h-5" />,
      to: "/channels",
    },
    {
      label: "過濾總表｜遊戲",
      icon: <FaClipboardList className="w-5 h-5" />,
      to: "/game-aliases",
    },
    {
      label: "過濾總表｜分類",
      icon: <FaClipboardList className="w-5 h-5" />,
      to: "/category-aliases",
    },
    {
      label: "更新紀錄",
      icon: <FaTools className="w-5 h-5" />,
      to: "/changelog",
    },
  ];

  const snsLinks = [
    {
      icon: <FaYoutube className="w-5 h-5" />,
      name: "YouTube",
      href: "https://www.youtube.com/@wasabi.pingkak",
    },
    {
      icon: <FaTwitter className="w-5 h-5" />,
      name: "Twitter",
      href: "https://x.com/wasabi_pingkak",
    },
    {
      icon: <FaGithub className="w-5 h-5" />,
      name: "GitHub",
      href: "https://github.com/WasabiPingKak/youtube-channel-info-fetcher",
    },
  ];

  return (
    <aside
      className={clsx(
        isMobile ? "w-full max-w-[240px]" : "hidden md:block",
        "fixed top-14 left-0 h-[calc(100%-56px)] bg-white dark:bg-zinc-900 shadow-lg z-40 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 flex flex-col justify-between",
        !isMobile && (collapsed ? "w-16" : "w-60")
      )}
    >
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 text-sm py-4 px-2">
          {menuItems.map((item) => (
            <SmartLink
              key={item.label}
              to={item.to}
              onClick={onItemClick}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-left text-gray-800 dark:text-gray-200"
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </SmartLink>
          ))}

          <hr className="my-3 border-gray-300 dark:border-zinc-700" />

          {isLoggedIn ? (
            <>
              <SmartLink
                to="/my-settings"
                onClick={onItemClick}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-left text-gray-800 dark:text-gray-200"
              >
                <FaUserCog className="w-5 h-5" />
                {!collapsed && <span>我的頻道設定</span>}
              </SmartLink>

              <SmartLink
                to={`/quick-category-editor/${user.channelId}`}
                onClick={onItemClick}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-left text-gray-800 dark:text-gray-200"
              >
                <IoFileTrayFull className="w-5 h-5" />
                {!collapsed && <span>自訂影片分類｜快速模式</span>}
              </SmartLink>

              <SmartLink
                to="/my-category-editor"
                onClick={onItemClick}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-left text-gray-800 dark:text-gray-200"
              >
                <IoFileTrayFull className="w-5 h-5" />
                {!collapsed && <span>自訂影片分類｜進階模式</span>}
              </SmartLink>

              <hr className="my-3 border-gray-300 dark:border-zinc-700" />
            </>
          ) : (
            <SmartLink
              to="/authorize-channel"
              onClick={onItemClick}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-left text-gray-800 dark:text-gray-200"
            >
              <span>🔗</span>
              {!collapsed && <span>連結我的頻道</span>}
            </SmartLink>
          )}

          <a
            href="https://forms.gle/QU3tMBTu7MgucSgZ7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-zinc-800"
          >
            <span>📝</span>
            {!collapsed && <span>協助擴增遊戲名單</span>}
          </a>

          <SmartLink
            to="/thanks"
            onClick={onItemClick}
            className="flex items-center gap-3 px-3 py-2 rounded text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-zinc-800"
          >
            <span>💖</span>
            {!collapsed && <span>感謝者名單</span>}
          </SmartLink>

          <SmartLink
            to="/privacy"
            onClick={onItemClick}
            className="flex items-center gap-3 px-3 py-2 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <MdPrivacyTip className="w-5 h-5" />
            {!collapsed && <span>隱私權政策</span>}
          </SmartLink>

          <hr className="my-3 border-gray-300 dark:border-zinc-700" />

        </nav>
      </div>

      <div className="px-2 pb-2">
        {snsLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 text-sm"
          >
            {link.icon}
            {!collapsed && <span>{link.name}</span>}
          </a>
        ))}
      </div>

      <div className="text-center text-xs text-gray-400 dark:text-zinc-500 py-3">
        © Wasabi PingKak
      </div>
    </aside>
  );
};

export default SidebarMenu;
