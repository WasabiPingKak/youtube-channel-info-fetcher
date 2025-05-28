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

    // ✅ 權限驗證與未登入處理
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

    // ✅ 只處理資料還沒完成載入的狀況
    if (meLoading || !me || !channelInfo?.channel_id) {
        return (
            <MainLayout>
                <div className="max-w-xl mx-auto p-6 text-center text-gray-500">
                    載入中...
                </div>
            </MainLayout>
        );
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
            </div>
        </MainLayout>
    );
}
