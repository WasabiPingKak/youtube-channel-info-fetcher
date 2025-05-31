import { useEffect, useMemo, useState } from "react";

const SORT_FIELDS = {
  TITLE: "title",
  PUBLISH_DATE: "publishDate",
  DURATION: "duration",
  GAME: "game",
  KEYWORDS: "keywords",
} as const;

type SortField = typeof SORT_FIELDS[keyof typeof SORT_FIELDS];

export const useVideoBrowseState = (videos: any[]) => {
  const [videoType, setVideoType] = useState<"live" | "videos" | "shorts">("live");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [sortField, setSortField] = useState<SortField>(SORT_FIELDS.PUBLISH_DATE);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const VIDEO_TYPE_MAP: Record<typeof videoType, string> = {
    live: "直播檔",
    videos: "影片",
    shorts: "Shorts",
  };

  const filteredVideos = useMemo(() => {
    const expectedType = VIDEO_TYPE_MAP[videoType];

    const base = videos.filter((video) => {
      const matchesType = video.type === expectedType;
      if (activeCategory === "全部") return matchesType;
      const matchesCategory =
        activeCategory &&
        video.matchedPairs?.some((pair) => pair.main === activeCategory);
      return matchesType && matchesCategory;
    });

    const direction = sortOrder === "asc" ? 1 : -1;

    const getVal = (video: any, field: SortField): any => {
      switch (field) {
        case SORT_FIELDS.TITLE:
          return video.title;
        case SORT_FIELDS.PUBLISH_DATE:
          return video.publishDate;
        case SORT_FIELDS.DURATION:
          return video.duration;
        case SORT_FIELDS.GAME:
          return video.game || "-";
        case SORT_FIELDS.KEYWORDS:
          return video.matchedKeywords?.length > 0
            ? video.matchedKeywords.join(", ")
            : "-";
        default:
          return "";
      }
    };

    return [...base].sort((a, b) => {
      const valA = getVal(a, sortField);
      const valB = getVal(b, sortField);

      if (sortField === SORT_FIELDS.PUBLISH_DATE) {
        return (new Date(valA).getTime() - new Date(valB).getTime()) * direction;
      }
      if (sortField === SORT_FIELDS.DURATION) {
        return (valA - valB) * direction;
      }

      const isMissingA = valA === "-";
      const isMissingB = valB === "-";
      if (isMissingA && isMissingB) return 0;
      if (isMissingA) return sortOrder === "asc" ? 1 : -1;
      if (isMissingB) return sortOrder === "asc" ? -1 : 1;

      return valA.localeCompare(valB, "zh-Hant-u-co-stroke") * direction;
    });
  }, [videos, videoType, activeCategory, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === SORT_FIELDS.PUBLISH_DATE ? "desc" : "asc");
    }
  };

  useEffect(() => {
    setActiveCategory("全部");
  }, [videoType]);

  return {
    SORT_FIELDS,
    videoType,
    setVideoType,
    activeCategory,
    setActiveCategory,
    sortField,
    sortOrder,
    handleSort,
    filteredVideos,
  };
};
