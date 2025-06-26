import React from "react";
import MainLayout from "../components/layout/MainLayout";

export default function LiveRedirectMaintenancePage() {
  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 px-4">
        <h1 className="text-3xl font-bold mb-4">🔧 功能維護中</h1>
        <p className="text-lg text-center">
          由於使用人數過多，<br className="sm:hidden" />
          <span className="whitespace-nowrap">此功能暫時關閉</span>，
          將於系統穩定後重新開放。
        </p>

      </div>
    </MainLayout>
  );
}
