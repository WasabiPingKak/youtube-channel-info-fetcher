import React from "react";
import { useMySettings } from "@/hooks/useMySettings";
import { PublicToggleSection } from "@/components/profile_settings/PublicToggleSection";
import { CountryFlagSelector } from "@/components/profile_settings/CountryFlagSelector";
import ChannelSelectorCard from "@/components/channels/ChannelSelectorCard";
import MainLayout from "../components/layout/MainLayout";
import { Link } from "react-router-dom";

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
