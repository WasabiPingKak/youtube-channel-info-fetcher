import { filterClassifiedVideos } from "./filterClassifiedVideos";
import type { ClassifiedVideoItem } from "@/types/category";

// ===== 測試資料 =====

// 實際 API 回傳的 type 值為中文（"直播檔"/"影片"/"Shorts"），
// 但 ClassifiedVideoItem 型別定義為 "live"|"videos"|"shorts"，兩者不一致。
// 測試以實際 runtime 值為準，用 as 繞過型別檢查。
const makeVideo = (
    overrides: Partial<ClassifiedVideoItem>,
): ClassifiedVideoItem => ({
    videoId: "v1",
    title: "test",
    publishDate: "2024-01-01",
    duration: 100,
    type: "直播檔" as ClassifiedVideoItem["type"],
    matchedCategories: [],
    ...overrides,
});

const videos: ClassifiedVideoItem[] = [
    makeVideo({
        videoId: "live-game",
        type: "直播檔" as ClassifiedVideoItem["type"],
        matchedPairs: [{ main: "遊戲", keyword: "GTA", hitKeywords: [] }],
    }),
    makeVideo({
        videoId: "live-chat",
        type: "直播檔" as ClassifiedVideoItem["type"],
        matchedPairs: [{ main: "雜談", keyword: "閒聊", hitKeywords: [] }],
    }),
    makeVideo({
        videoId: "video-game",
        type: "影片" as ClassifiedVideoItem["type"],
        matchedPairs: [{ main: "遊戲", keyword: "FF14", hitKeywords: [] }],
    }),
    makeVideo({
        videoId: "shorts-music",
        type: "Shorts" as ClassifiedVideoItem["type"],
        matchedPairs: [{ main: "音樂", keyword: "cover", hitKeywords: [] }],
    }),
    makeVideo({
        videoId: "live-no-pairs",
        type: "直播檔" as ClassifiedVideoItem["type"],
        matchedPairs: undefined,
    }),
];

// ===== 測試 =====

describe("filterClassifiedVideos", () => {
    describe("按 videoType 篩選", () => {
        it("應篩出直播檔", () => {
            const result = filterClassifiedVideos(videos, "live", "全部");
            const ids = result.map((v) => v.videoId);
            expect(ids).toEqual(["live-game", "live-chat", "live-no-pairs"]);
        });

        it("應篩出影片", () => {
            const result = filterClassifiedVideos(videos, "videos", "全部");
            expect(result.map((v) => v.videoId)).toEqual(["video-game"]);
        });

        it("應篩出 Shorts", () => {
            const result = filterClassifiedVideos(videos, "shorts", "全部");
            expect(result.map((v) => v.videoId)).toEqual(["shorts-music"]);
        });
    });

    describe("按 category 篩選", () => {
        it("「全部」只篩 type，不看 category", () => {
            const result = filterClassifiedVideos(videos, "live", "全部");
            expect(result).toHaveLength(3);
        });

        it("特定 category 同時篩 type + matchedPairs.main", () => {
            const result = filterClassifiedVideos(videos, "live", "遊戲");
            expect(result.map((v) => v.videoId)).toEqual(["live-game"]);
        });

        it("沒有符合的 category 時回傳空陣列", () => {
            const result = filterClassifiedVideos(videos, "live", "節目");
            expect(result).toEqual([]);
        });
    });

    describe("邊界情況", () => {
        it("matchedPairs 為 undefined 時不 crash", () => {
            const result = filterClassifiedVideos(videos, "live", "遊戲");
            // live-no-pairs 沒有 matchedPairs，不應被選中也不應拋錯
            expect(result.every((v) => v.videoId !== "live-no-pairs")).toBe(
                true,
            );
        });

        it("matchedPairs 為空陣列時不 crash", () => {
            const input = [makeVideo({ matchedPairs: [] })];
            const result = filterClassifiedVideos(input, "live", "遊戲");
            expect(result).toEqual([]);
        });

        it("空陣列輸入回傳空陣列", () => {
            expect(filterClassifiedVideos([], "live", "全部")).toEqual([]);
        });
    });
});
