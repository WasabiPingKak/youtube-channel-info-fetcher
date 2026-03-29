import { VideoItem } from "../types/video";

export const sortVideos = <T extends VideoItem>(
  videos: T[],
  sortField: string,
  sortOrder: "asc" | "desc"
): T[] => {
  return [...videos].sort((a, b) => {
    const aValue = (a as Record<string, unknown>)[sortField] || "";
    const bValue = (b as Record<string, unknown>)[sortField] || "";

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
};
