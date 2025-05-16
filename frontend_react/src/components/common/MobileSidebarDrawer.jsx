// src/components/common/MobileSidebarDrawer.jsx
import React from "react";
import SidebarMenu from "./SidebarMenu";
import clsx from "clsx";

const MobileSidebarDrawer = ({ open, onClose }) => {
    return (
        <>
            {/* ✅ 背景遮罩 */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* ✅ 側邊欄抽屜本體 */}
            <div
                className={clsx(
                    "fixed inset-y-0 left-0 w-60 bg-white dark:bg-zinc-900 shadow-lg z-40 transition-transform duration-300 md:hidden",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarMenu
                    collapsed={false}
                    setCollapsed={() => { }}
                    isMobile={true}
                />
            </div>
        </>
    );
};

export default MobileSidebarDrawer;
