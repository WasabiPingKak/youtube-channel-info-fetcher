import React, { useState } from "react";
import SidebarMenu from "../common/SidebarMenu";

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex">
      <SidebarMenu collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`flex-1 py-6 px-6 overflow-x-hidden transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-60"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
