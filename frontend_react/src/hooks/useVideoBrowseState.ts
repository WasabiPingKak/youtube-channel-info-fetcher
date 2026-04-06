import { useEffect, useMemo, useState } from "react";
import type { ClassifiedVideoItem } from "@/types/category";
import {
    filterClassifiedVideos,
    type VideoType,
} from "@/utils/filterClassifiedVideos";
import {
    sortClassifiedVideos,
    SORT_FIELDS,
    type SortField,
    type SortOrder,
} from "@/utils/sortClassifiedVideos";

export const useVideoBrowseState = (videos: ClassifiedVideoItem[]) => {
    const [videoType, setVideoType] = useState<VideoType>("live");
    const [activeCategory, setActiveCategory] = useState("全部");
    const [sortField, setSortField] = useState<SortField>(SORT_FIELDS.PUBLISH_DATE);
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const filteredVideos = useMemo(() => {
        const filtered = filterClassifiedVideos(videos, videoType, activeCategory);
        return sortClassifiedVideos(filtered, sortField, sortOrder);
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
