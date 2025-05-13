import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaYoutube, FaTwitter, FaHome, FaGithub } from "react-icons/fa";
import { RiSidebarUnfoldFill } from "react-icons/ri";
import { GrAnalytics } from "react-icons/gr";
import { MdPrivacyTip } from "react-icons/md";

const DEFAULT_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const SidebarMenu = ({ collapsed, setCollapsed }) => {
    const navigate = useNavigate();

    const handleOpenChannelDrawer = () => {
        // 派發事件給外層開 Drawer（你可依實作方式改成 props 控制）
        window.dispatchEvent(new CustomEvent("open-channel-drawer"));
    };

    const menuItems = [
        {
            label: "首頁",
            icon: <FaHome className="w-5 h-5" />,
            action: () => navigate(`/videos?channel=${DEFAULT_CHANNEL_ID}`),
        },
        {
            label: "切換頻道",
            icon: <RiSidebarUnfoldFill className="w-5 h-5" />,
            action: handleOpenChannelDrawer,
        },
    ];

    const snsLinks = [
        { icon: <FaYoutube className="w-5 h-5" />, name: "YouTube", href: "https://www.youtube.com/@wasabi.pingkak" },
        { icon: <FaTwitter className="w-5 h-5" />, name: "Twitter", href: "https://x.com/wasabi_pingkak" },
        { icon: <FaGithub className="w-5 h-5" />, name: "GitHub", href: "https://github.com/WasabiPingKak/youtube-channel-info-fetcher" },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-full ${collapsed ? "w-16" : "w-60"
                } bg-white dark:bg-zinc-900 shadow-lg flex flex-col justify-between z-50 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300`}
        >
            <div className="flex items-center justify-between px-4 py-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    title={collapsed ? "展開側邊欄" : "收合側邊欄"}
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
                <div className={`flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white ${collapsed ? "hidden" : "flex"}`}>
                    <GrAnalytics className="w-6 h-6" />
                    <span>頻道分析 Beta</span>
                </div>
            </div>

            <nav className="flex-1 px-2 space-y-1 text-sm">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center w-full px-4 py-3 gap-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                    >
                        <span>{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </button>
                ))}

                <hr className="my-4 border-gray-300 dark:border-zinc-700" />

                {snsLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-3 gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                    >
                        <span>{link.icon}</span>
                        {!collapsed && <span>{link.name}</span>
                        }
                    </a>
                ))}

                <hr className="my-4 border-gray-300 dark:border-zinc-700" />
                <button
                    onClick={() => navigate("/authorize-channel")}
                    className="flex items-center w-full px-4 py-3 gap-3 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-zinc-800 rounded"
                >
                    <span>🔗</span>
                    {!collapsed && <span>授權我的頻道(尚未開放)</span>}
                </button>
                <a
                    href="https://forms.gle/QU3tMBTu7MgucSgZ7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-3 gap-3 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded"
                >
                    <span>📝</span>
                    {!collapsed && <span>協助擴增遊戲名單</span>}
                </a>
                <button
                    onClick={() => navigate("/thanks")}
                    className="flex items-center w-full px-4 py-3 gap-3 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-zinc-800 rounded"
                >
                    <span>💖</span>
                    {!collapsed && <span>感謝者名單</span>}
                </button>
                <button
                    onClick={() => navigate("/privacy")}
                    className="flex items-center w-full px-4 py-3 gap-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                >
                    <MdPrivacyTip className="w-5 h-5" />
                    {!collapsed && <span>隱私權政策</span>}
                </button>
            </nav>

            <div className={`p-3 text-xs text-gray-400 text-center ${collapsed ? "hidden" : "block"}`}>
                © 2025 by Wasabi PingKak
            </div>
        </aside>
    );
};

export default SidebarMenu;
