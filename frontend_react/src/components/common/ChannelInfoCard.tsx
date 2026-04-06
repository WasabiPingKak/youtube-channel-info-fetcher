import { useParams, useSearchParams } from "react-router-dom";
import { useChannelIndex } from "../../hooks/useChannelIndex";
import { FaEyeSlash } from "react-icons/fa6";
import { ExternalLink } from "lucide-react";
import CountryFlags from "@/components/badges/CountryFlags";
import DeveloperBadge from "@/components/badges/DeveloperBadge";

const ADMIN_CHANNEL_ID = import.meta.env.VITE_ADMIN_CHANNEL_ID;

interface ChannelInfoCardProps {
  channelId?: string;
}

export default function ChannelInfoCard({ channelId: channelIdProp }: ChannelInfoCardProps) {
  const { channelId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const channelId = channelIdProp || paramId || searchParams.get("channel") || ADMIN_CHANNEL_ID;
  const { data, isLoading, error } = useChannelIndex(channelId);
  const isAuthor = channelId === ADMIN_CHANNEL_ID;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700" />
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
        頻道資訊載入失敗
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <a href={data.url} target="_blank" rel="noopener noreferrer">
        <img
          src={data.thumbnail}
          alt={data.name}
          className="w-9 h-9 rounded-full object-cover"
        />
      </a>

      <div className="flex items-center gap-2 min-w-0">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-base hover:underline truncate"
        >
          {data.name}
        </a>

        <CountryFlags countryCode={data.countryCode} />
        <DeveloperBadge isAuthor={isAuthor} />

        {data.enabled === false && (
          <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
            <FaEyeSlash size={12} />
            未公開
          </span>
        )}

        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto shrink-0"
          title="前往 YouTube 頻道"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
