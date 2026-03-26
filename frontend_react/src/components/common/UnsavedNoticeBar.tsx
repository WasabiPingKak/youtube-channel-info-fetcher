import React from "react";

export default function UnsavedNoticeBar() {
  return (
    <div className="absolute top-0 left-0 w-full bg-yellow-300 text-black text-center py-2 z-50">
      ⚠ 尚未儲存變更，請記得點選下方按鈕儲存。
    </div>
  );
}
