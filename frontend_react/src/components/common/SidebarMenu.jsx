import { useNavigate } from "react-router-dom";
import { FaYoutube, FaTwitter, FaUser, FaGithub, FaChartLine } from "react-icons/fa";
import { MdPrivacyTip } from "react-icons/md";
import { TbSwitch } from "react-icons/tb";
import clsx from "clsx";

const DEFAULT_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const SidebarMenu = ({ collapsed, setCollapsed, isMobile = false, onItemClick }) => {
    const navigate = useNavigate();

    const menuItems = [
        {
            label: "頻道遊戲趨勢",
            icon: <FaChartLine className="w-5 h-5" />,
            action: () => navigate("/trending"),
        },
        {
            label: "檢視個別頻道",
            icon: <FaUser className="w-5 h-5" />,
            action: () => navigate("/channels"),
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
                "fixed top-14 left-0 h-[calc(100%-56px)] bg-white dark:bg-zinc-900 shadow-lg z-40 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 overflow-y-auto",
                !isMobile && (collapsed ? "w-16" : "w-60")
            )}
        >
            <nav className="flex flex-col gap-1 text-sm py-4 px-2">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => {
                            if (onItemClick) onItemClick();
                            item.action();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-left text-gray-800 dark:text-gray-200"
                    >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                    </button>
                ))}

                <hr className="my-3 border-gray-300 dark:border-zinc-700" />

                {snsLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                    >
                        {link.icon}
                        {!collapsed && <span>{link.name}</span>}
                    </a>
                ))}

                <hr className="my-3 border-gray-300 dark:border-zinc-700" />

                <button
                    onClick={() => navigate("/authorize-channel")}
                    className="flex items-center gap-3 px-3 py-2 rounded text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-zinc-800"
                >
                    <span>🔗</span>
                    {!collapsed && <span>授權我的頻道(未開放)</span>}
                </button>

                <a
                    href="https://forms.gle/QU3tMBTu7MgucSgZ7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-zinc-800"
                >
                    <span>📝</span>
                    {!collapsed && <span>協助擴增遊戲名單</span>}
                </a>

                <button
                    onClick={() => navigate("/thanks")}
                    className="flex items-center gap-3 px-3 py-2 rounded text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-zinc-800"
                >
                    <span>💖</span>
                    {!collapsed && <span>感謝者名單</span>}
                </button>

                <button
                    onClick={() => navigate("/privacy")}
                    className="flex items-center gap-3 px-3 py-2 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <MdPrivacyTip className="w-5 h-5" />
                    {!collapsed && <span>隱私權政策</span>}
                </button>
            </nav>
        </aside>
    );
};

export default SidebarMenu;
