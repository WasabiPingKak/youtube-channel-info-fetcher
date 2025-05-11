import { useParams, useSearchParams } from "react-router-dom";
import { useChannelInfo } from "../../hooks/useChannelInfo";

const DEFAULT_CHANNEL_ID = import.meta.env.VITE_DEFAULT_CHANNEL_ID;

export default function ChannelInfoCard() {
  const { channelId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("channel");

  // 優先使用路由參數，再用 query string，最後 fallback 預設頻道
  const finalChannelId = paramId || queryId || DEFAULT_CHANNEL_ID;

  const { data, isLoading, error } = useChannelInfo(finalChannelId);
  const isAuthor = finalChannelId === DEFAULT_CHANNEL_ID;

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
          className="font-bold text-lg hover:underline flex items-center gap-2"
        >
          {data.name}
          {isAuthor && (
            <span
              className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
              title="本站開發者"
            >
              🛠️ 本站製作者
            </span>
          )}
        </a>
        <div className="text-sm text-gray-500">前往 YouTube 頻道 ↗</div>
      </div>
    </div>
  );
}
