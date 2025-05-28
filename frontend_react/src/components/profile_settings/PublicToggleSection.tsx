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
                <span className="font-medium">讓我的頻道頁面對其他人公開</span>
                <div className="text-sm text-muted-foreground mt-1">
                    啟用後，你的頻道會出現在首頁頻道列表，並可透過網址分享。
                </div>
            </div>
        </section>
    );
}
