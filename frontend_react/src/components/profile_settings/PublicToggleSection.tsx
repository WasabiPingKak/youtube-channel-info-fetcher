import React from "react";

interface Props {
  enabled: boolean;
  onChange: (value: boolean) => void;
}

export function PublicToggleSection({ enabled, onChange }: Props) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between">

        {/* ✅ 自訂 Toggle Switch */}
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-teal-600" : "bg-gray-300"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
      </div>
      <div>
        <span className="font-medium">讓我的頻道分析頁面對其他人公開</span>
        <div className="text-sm text-muted-foreground mt-1">
          啟用後，你的頻道會出現在首頁頻道列表，並可透過網址分享。
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          若您選擇關閉公開，您的頻道分析頁面將立即隱藏，無法被他人瀏覽。
          不過，與排行榜或熱門趨勢相關的統計資料，因系統快取機制，可能會延遲數小時才更新，屆時數值才會完全反映非公開狀態。
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          此設定與下方的直播狀態互相獨立，開關與否不會影響顯示你是否正在直播。
        </div>
      </div>
    </section>
  );
}
