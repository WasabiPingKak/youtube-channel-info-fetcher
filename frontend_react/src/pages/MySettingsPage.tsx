import React, { useEffect } from "react";
import { useMySettings } from "@/hooks/useMySettings";
import { useMyChannelId } from "@/hooks/useMyChannelId";
import { PublicToggleSection } from "@/components/profile_settings/PublicToggleSection";
import { CountryFlagSelector } from "@/components/profile_settings/CountryFlagSelector";
import ChannelSelectorCard from "@/components/channels/ChannelSelectorCard";
import MainLayout from "../components/layout/MainLayout";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function MySettingsPage() {
    const {
        enabled,
        setEnabled,
        selectedCountries,
        setSelectedCountries,
        loading,
        handleSave,
        channelInfo,
    } = useMySettings();

    const {
        data: me,
        isLoading: meLoading,
        error: meError,
    } = useMyChannelId();

    const navigate = useNavigate();

    // ✅ 匿名未登入使用者處理
    useEffect(() => {
        if (!meLoading && me?.channelId === null) {
            toast.error("請先登入以編輯頻道設定");
            navigate("/");
        }
    }, [meLoading, me]);

    // ✅ 權限驗證：登入者只能看自己的頻道設定
    useEffect(() => {
        const myId = me?.channelId;
        const targetId = channelInfo?.channel_id;

        if (
            meError ||
            (!meLoading && myId && targetId && myId !== targetId)
        ) {
            toast.error("您沒有權限查看設定頁面");
            navigate("/");
        }
    }, [meLoading, me, meError, channelInfo?.channel_id]);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/logout", { method: "POST" });
            if (!res.ok) throw new Error("Logout failed");
            toast.success("已成功登出");
            navigate("/");
        } catch (err) {
            toast.error("登出失敗，請稍後再試");
        }
    };

    // ✅ 載入狀態
    if (meLoading || !channelInfo?.channel_id) {
        return (
            <MainLayout>
                <div className="max-w-xl mx-auto p-6 text-center text-gray-500">
                    載入中...
                </div>
            </MainLayout>
        );
    }

    // ✅ 匿名者導向中（避免畫面閃爍）
    if (me?.channelId === null) {
        return null;
    }

    return (
        <MainLayout>
            <div className="max-w-xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">我的頻道設定</h1>

                {channelInfo && (
                    <div className="mb-6">
                        <ChannelSelectorCard channel={channelInfo} onClick={() => { }} />
                    </div>
                )}

                {channelInfo?.channel_id && (
                    <div className="mt-2">
                        <Link
                            to={`/videos?channel=${channelInfo.channel_id}`}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            查看我的頻道頁面
                        </Link>
                    </div>
                )}

                <PublicToggleSection
                    enabled={enabled}
                    onChange={setEnabled}
                />

                <CountryFlagSelector
                    selected={selectedCountries}
                    onChange={setSelectedCountries}
                />

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    儲存設定
                </button>

                <button
                    onClick={handleLogout}
                    className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    登出
                </button>
            </div>
        </MainLayout>
    );
}
