import { useParams, useSearchParams } from "react-router-dom";
import { useChannelIndex } from "../../hooks/useChannelIndex";
import { FaEyeSlash } from "react-icons/fa6";
import CountryFlags from "@/components/badges/CountryFlags";
import DeveloperBadge from "@/components/badges/DeveloperBadge";

const ADMIN_CHANNEL_ID = import.meta.env.VITE_ADMIN_CHANNEL_ID;

export default function ChannelInfoCard() {
  const { channelId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("channel");

  const finalChannelId = paramId || queryId || ADMIN_CHANNEL_ID;

  const { data, isLoading, error } = useChannelIndex(finalChannelId);
  const isAuthor = finalChannelId === ADMIN_CHANNEL_ID;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse h-20 w-full mb-4 max-w-xl mx-auto" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 p-4 mb-4 max-w-xl mx-auto">
        頻道資訊載入失敗
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-800 w-full max-w-xl flex items-center gap-4 rounded-2xl shadow p-4 mb-4">
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

          {data.enabled === false && (
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
              <FaEyeSlash className="inline-block" />
              此頻道未公開
            </span>
          )}

          <DeveloperBadge isAuthor={isAuthor} />
        </a>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          前往 YouTube 頻道 ↗
        </div>

        <CountryFlags countryCode={data.countryCode} />
      </div>
    </div>
  );
}
