import { useChannelInfo } from "../../hooks/useChannelInfo";
import { useSearchParams } from "react-router-dom";

export default function ChannelInfoCard() {
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel") || "UCLxa0YOtqi8IR5r2dSLXPng";

  const { data, isLoading, error } = useChannelInfo(channelId);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gray-100 animate-pulse h-20 w-full mb-4 max-w-xl mx-auto" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-100 text-red-700 p-4 mb-4 max-w-xl mx-auto">
        頻道資訊載入失敗
      </div>
    );
  }

  return (
    <div className="bg-gray-50 w-full max-w-xl flex items-center gap-4 rounded-2xl shadow p-4 mb-4">
      <a href={data.url} target="_blank" rel="noopener noreferrer">
        <img
          src={data.thumbnail}
          alt={data.name}
          className="w-14 h-14 rounded-full object-cover"
        />
      </a>
      <div>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-lg hover:underline"
        >
          {data.name}
        </a>
        <div className="text-sm text-gray-500">前往 YouTube 頻道 ↗</div>
      </div>
    </div>
  );
}
