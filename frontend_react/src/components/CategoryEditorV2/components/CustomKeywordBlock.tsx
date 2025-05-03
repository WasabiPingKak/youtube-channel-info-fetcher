import React from "react";

const CustomKeywordBlock: React.FC = () => {
  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      <header className="mb-2">
        <h3 className="font-semibold mb-1">✍️ 自訂關鍵字</h3>
        <p className="text-sm text-gray-500">
          手動新增分類關鍵字（自訂）※尚未實作
        </p>
      </header>
      <div className="text-sm text-gray-400 border border-dashed rounded p-4">
        此區預留給自訂關鍵字功能，未來可由使用者自行輸入關鍵字來建立分類。
      </div>
    </section>
  );
};

export default CustomKeywordBlock;
