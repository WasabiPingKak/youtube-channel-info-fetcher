import React, { useState, useEffect } from "react";
import SidebarMenu from "../common/SidebarMenu";
import TopNav from "../common/TopNav";

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  // ✅ 自動根據視窗寬度切換 sidebar 是否收合
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setCollapsed(isMobile);
    };

    handleResize(); // 初次執行
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* ✅ 固定頂部導覽列 */}
      <TopNav collapsed={collapsed} toggleCollapsed={() => setCollapsed((c) => !c)} />

      <div className="flex pt-14"> {/* 🧱 空出頂部高度 h-14 */}
        {/* ✅ 側邊欄（展開／收合由父層控制） */}
        <SidebarMenu collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* ✅ 主內容區：根據 collapsed 狀態調整 margin */}
        <main
          className={`flex-1 px-4 sm:px-6 py-6 transition-all duration-300 max-w-full overflow-x-auto ${
            collapsed ? "ml-16" : "ml-60"
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default MainLayout;
