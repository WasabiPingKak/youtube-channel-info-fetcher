import { VideoItem } from "../types/video";

export const sortVideos = (
  videos: VideoItem[],
  sortField: string,
  sortOrder: "asc" | "desc"
): VideoItem[] => {
  return [...videos].sort((a, b) => {
    const aValue = a[sortField] || "";
    const bValue = b[sortField] || "";

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
};
