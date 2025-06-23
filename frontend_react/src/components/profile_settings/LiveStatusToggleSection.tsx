import React from "react";

interface Props {
  visible: boolean;
  onChange: (value: boolean) => void;
}

export function LiveStatusToggleSection({ visible, onChange }: Props) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between">

        {/* ✅ 自訂 Toggle Switch */}
        <button
          role="switch"
          aria-checked={visible}
          onClick={() => onChange(!visible)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${visible ? "bg-teal-600" : "bg-gray-300"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${visible ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
      </div>
      <div>
        <span className="font-medium">公開我正在直播中的狀態（供其他主播降落導流使用）</span>
        <div className="text-sm text-muted-foreground mt-1">
          若開啟，其他人可在
          <a
            href="/live-redirect"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline mx-1"
          >
            降落轉機塔臺
          </a>
          中看到你的頻道正在開台。
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          這個設定與頻道分析頁互相獨立，與頻道分析頁是否公開無關。
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          你可以關閉頻道分析，但是打開直播中的狀態，你的直播資訊依然會出現在轉機塔臺中。
        </div>
      </div>
    </section>
  );
}
