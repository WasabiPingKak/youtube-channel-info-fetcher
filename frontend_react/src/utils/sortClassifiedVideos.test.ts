import { sortClassifiedVideos } from "./sortClassifiedVideos";
import type { ClassifiedVideoItem } from "@/types/category";

// ===== 測試資料 =====

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

// ===== 測試 =====

describe("sortClassifiedVideos", () => {
    describe("publishDate 排序", () => {
        const videos = [
            makeVideo({ videoId: "a", publishDate: "2024-03-01" }),
            makeVideo({ videoId: "b", publishDate: "2024-01-15" }),
            makeVideo({ videoId: "c", publishDate: "2024-06-10" }),
        ];

        it("升冪：最早日期在前", () => {
            const result = sortClassifiedVideos(videos, "publishDate", "asc");
            expect(result.map((v) => v.videoId)).toEqual(["b", "a", "c"]);
        });

        it("降冪：最新日期在前", () => {
            const result = sortClassifiedVideos(videos, "publishDate", "desc");
            expect(result.map((v) => v.videoId)).toEqual(["c", "a", "b"]);
        });
    });

    describe("duration 排序", () => {
        const videos = [
            makeVideo({ videoId: "short", duration: 30 }),
            makeVideo({ videoId: "long", duration: 7200 }),
            makeVideo({ videoId: "mid", duration: 600 }),
        ];

        it("升冪：最短在前", () => {
            const result = sortClassifiedVideos(videos, "duration", "asc");
            expect(result.map((v) => v.videoId)).toEqual([
                "short",
                "mid",
                "long",
            ]);
        });

        it("降冪：最長在前", () => {
            const result = sortClassifiedVideos(videos, "duration", "desc");
            expect(result.map((v) => v.videoId)).toEqual([
                "long",
                "mid",
                "short",
            ]);
        });
    });

    describe("title 中文排序", () => {
        const videos = [
            makeVideo({ videoId: "b", title: "大冒險" }),
            makeVideo({ videoId: "a", title: "一日生活" }),
            makeVideo({ videoId: "c", title: "開箱" }),
        ];

        it("應使用 localeCompare 排序", () => {
            const asc = sortClassifiedVideos(videos, "title", "asc");
            const desc = sortClassifiedVideos(videos, "title", "desc");
            // 確認升降冪順序相反
            expect(asc.map((v) => v.videoId)).toEqual(
                desc.map((v) => v.videoId).reverse(),
            );
        });
    });

    describe("game 排序（含缺值）", () => {
        const videos = [
            makeVideo({ videoId: "ff14", game: "FF14" }),
            makeVideo({ videoId: "no-game", game: null }),
            makeVideo({ videoId: "gta", game: "GTA" }),
            makeVideo({ videoId: "undef-game", game: undefined }),
        ];

        it("asc：缺值推到尾端", () => {
            const result = sortClassifiedVideos(videos, "game", "asc");
            const ids = result.map((v) => v.videoId);
            // 有值的在前，缺值在後
            expect(ids.slice(0, 2)).toEqual(["ff14", "gta"]);
            expect(ids.slice(2)).toEqual(
                expect.arrayContaining(["no-game", "undef-game"]),
            );
        });

        it("desc：缺值推到尾端（前面）", () => {
            const result = sortClassifiedVideos(videos, "game", "desc");
            const ids = result.map((v) => v.videoId);
            // desc 時缺值在前
            expect(ids.slice(0, 2)).toEqual(
                expect.arrayContaining(["no-game", "undef-game"]),
            );
            expect(ids.slice(2)).toEqual(["gta", "ff14"]);
        });
    });

    describe("keywords 排序（含缺值）", () => {
        const videos = [
            makeVideo({
                videoId: "has-kw",
                matchedKeywords: ["Minecraft", "建築"],
            }),
            makeVideo({ videoId: "no-kw", matchedKeywords: [] }),
            makeVideo({
                videoId: "has-kw2",
                matchedKeywords: ["APEX"],
            }),
            makeVideo({ videoId: "undef-kw", matchedKeywords: undefined }),
        ];

        it("asc：缺值推到尾端", () => {
            const result = sortClassifiedVideos(videos, "keywords", "asc");
            const ids = result.map((v) => v.videoId);
            expect(ids[0]).toBe("has-kw2"); // "APEX" < "Minecraft, 建築"
            expect(ids[1]).toBe("has-kw");
            expect(ids.slice(2)).toEqual(
                expect.arrayContaining(["no-kw", "undef-kw"]),
            );
        });

        it("desc：缺值推到前面", () => {
            const result = sortClassifiedVideos(videos, "keywords", "desc");
            const ids = result.map((v) => v.videoId);
            expect(ids.slice(0, 2)).toEqual(
                expect.arrayContaining(["no-kw", "undef-kw"]),
            );
        });
    });

    describe("邊界情況", () => {
        it("空陣列回傳空陣列", () => {
            expect(sortClassifiedVideos([], "title", "asc")).toEqual([]);
        });

        it("單元素陣列直接回傳", () => {
            const input = [makeVideo({ videoId: "only" })];
            const result = sortClassifiedVideos(input, "title", "asc");
            expect(result).toHaveLength(1);
            expect(result[0].videoId).toBe("only");
        });

        it("不改動原始陣列（non-mutating）", () => {
            const input = [
                makeVideo({ videoId: "b", title: "B" }),
                makeVideo({ videoId: "a", title: "A" }),
            ];
            const original = [...input];
            sortClassifiedVideos(input, "title", "asc");
            expect(input).toEqual(original);
        });
    });
});
