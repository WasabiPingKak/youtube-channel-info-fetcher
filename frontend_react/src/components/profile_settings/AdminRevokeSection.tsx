import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { showFailureToast } from "@/components/common/ToastManager";

export function AdminRevokeSection() {
    const [targetChannelId, setTargetChannelId] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRevoke = async () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ target_channel_id: targetChannelId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg = data?.error || `撤銷失敗 (${res.status})`;
                showFailureToast(msg);
                return;
            }

            toast.success(`已撤銷 ${targetChannelId} 的授權`);
            setTargetChannelId("");
        } catch {
            showFailureToast("撤銷請求失敗");
        } finally {
            setLoading(false);
            setConfirming(false);
        }
    };

    const handleCancel = () => {
        setConfirming(false);
    };

    return (
        <section className="mt-10 pt-6 border-t border-red-300 dark:border-red-500/40">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                管理員操作
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                撤銷指定頻道的 OAuth 授權，該頻道所有已登入的 session 將立即失效。
            </p>

            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    placeholder="輸入 Channel ID (UC...)"
                    value={targetChannelId}
                    onChange={(e) => {
                        setTargetChannelId(e.target.value.trim());
                        setConfirming(false);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-600
                               rounded bg-white dark:bg-zinc-800
                               text-gray-900 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    disabled={loading}
                />

                {confirming ? (
                    <>
                        <button
                            onClick={handleRevoke}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold
                                       rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? "撤銷中..." : "確定撤銷"}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-300 dark:bg-zinc-600 text-gray-700
                                       dark:text-gray-200 text-sm rounded hover:bg-gray-400
                                       dark:hover:bg-zinc-500 disabled:opacity-50"
                        >
                            取消
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleRevoke}
                        disabled={!targetChannelId || loading}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold
                                   rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        撤銷授權
                    </button>
                )}
            </div>

            {confirming && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                    確定要撤銷 <span className="font-mono font-bold">{targetChannelId}</span> 的授權？此操作無法復原。
                </p>
            )}
        </section>
    );
}
