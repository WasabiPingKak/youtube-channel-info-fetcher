import {
    filterChartVideos,
    aggregateVideoMetrics,
    convertDurationUnit,
} from "./chartDataUtils";
import type { ClassifiedVideoItem } from "@/types/category";

// ===== 測試資料 =====

const makeVideo = (
    overrides: Partial<ClassifiedVideoItem>,
): ClassifiedVideoItem => ({
    videoId: "v1",
    title: "test",
    publishDate: "2024-01-01",
    duration: 3600,
    type: "直播檔" as ClassifiedVideoItem["type"],
    matchedCategories: [],
    ...overrides,
});

// ===== filterChartVideos =====

describe("filterChartVideos", () => {
    const videos = [
        makeVideo({
            videoId: "live-game",
            type: "直播檔" as ClassifiedVideoItem["type"],
            matchedCategories: ["遊戲"],
            game: "FF14",
        }),
        makeVideo({
            videoId: "live-chat",
            type: "直播檔" as ClassifiedVideoItem["type"],
            matchedCategories: ["雜談"],
            game: null,
        }),
        makeVideo({
            videoId: "live-no-game",
            type: "直播檔" as ClassifiedVideoItem["type"],
            matchedCategories: ["遊戲"],
            game: undefined,
        }),
        makeVideo({
            videoId: "video-music",
            type: "影片" as ClassifiedVideoItem["type"],
            matchedCategories: ["音樂"],
        }),
    ];

    it("「全部」只篩 type", () => {
        const result = filterChartVideos(videos, "直播檔", "全部");
        expect(result).toHaveLength(3);
    });

    it("「遊戲」篩 type + 檢查 video.game 存在", () => {
        const result = filterChartVideos(videos, "直播檔", "遊戲");
        expect(result.map((v) => v.videoId)).toEqual(["live-game"]);
    });

    it("特定分類篩 matchedCategories", () => {
        const result = filterChartVideos(videos, "直播檔", "雜談");
        expect(result.map((v) => v.videoId)).toEqual(["live-chat"]);
    });

    it("不同 type 不會混入", () => {
        const result = filterChartVideos(videos, "影片", "全部");
        expect(result.map((v) => v.videoId)).toEqual(["video-music"]);
    });

    it("空陣列回傳空陣列", () => {
        expect(filterChartVideos([], "直播檔", "全部")).toEqual([]);
    });
});

// ===== aggregateVideoMetrics =====

describe("aggregateVideoMetrics", () => {
    describe("全部模式", () => {
        const videos = [
            makeVideo({
                videoId: "v1",
                matchedCategories: ["遊戲", "雜談"],
                duration: 1000,
            }),
            makeVideo({
                videoId: "v2",
                matchedCategories: ["遊戲"],
                duration: 2000,
            }),
            makeVideo({
                videoId: "v3",
                matchedCategories: ["未分類"],
                duration: 500,
            }),
        ];

        it("依 matchedCategories 分組計數", () => {
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "全部",
            );
            const gameEntry = countData.find((d) => d.category === "遊戲");
            const chatEntry = countData.find((d) => d.category === "雜談");
            expect(gameEntry?.count).toBe(2);
            expect(chatEntry?.count).toBe(1);
        });

        it("依 matchedCategories 分組計算時長", () => {
            const { durationData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "全部",
            );
            const gameEntry = durationData.find(
                (d) => d.category === "遊戲",
            );
            expect(gameEntry?.duration).toBe(3000);
        });

        it("未分類排在最後", () => {
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "全部",
            );
            expect(countData[countData.length - 1].category).toBe("未分類");
        });

        it("依 count 降冪排序（未分類除外）", () => {
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "全部",
            );
            // 遊戲(2) > 雜談(1) > 未分類(1, 永遠最後)
            expect(countData[0].category).toBe("遊戲");
            expect(countData[1].category).toBe("雜談");
        });
    });

    describe("遊戲模式", () => {
        const videos = [
            makeVideo({
                videoId: "v1",
                game: "FF14",
                duration: 1000,
            }),
            makeVideo({
                videoId: "v2",
                game: "FF14",
                duration: 2000,
            }),
            makeVideo({
                videoId: "v3",
                game: "GTA",
                duration: 3000,
            }),
            makeVideo({
                videoId: "v4",
                game: null,
                duration: 500,
            }),
        ];

        it("依 game 分組", () => {
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "遊戲",
            );
            expect(countData).toHaveLength(2);
            expect(countData.find((d) => d.category === "FF14")?.count).toBe(
                2,
            );
            expect(countData.find((d) => d.category === "GTA")?.count).toBe(1);
        });

        it("game 為 null 的影片不計入", () => {
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "遊戲",
            );
            const total = countData.reduce((sum, d) => sum + d.count, 0);
            expect(total).toBe(3); // v4 被排除
        });

        it("時長正確累計", () => {
            const { durationData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "遊戲",
            );
            expect(
                durationData.find((d) => d.category === "FF14")?.duration,
            ).toBe(3000);
        });
    });

    describe("特定分類模式", () => {
        const videos = [
            makeVideo({
                videoId: "v1",
                matchedPairs: [
                    { main: "雜談", keyword: "閒聊", hitKeywords: [] },
                    { main: "雜談", keyword: "日常", hitKeywords: [] },
                ],
                duration: 1000,
            }),
            makeVideo({
                videoId: "v2",
                matchedPairs: [
                    { main: "雜談", keyword: "閒聊", hitKeywords: [] },
                    { main: "音樂", keyword: "cover", hitKeywords: [] },
                ],
                duration: 2000,
            }),
        ];

        it("依符合分類的 keyword 分組", () => {
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "雜談",
            );
            expect(countData.find((d) => d.category === "閒聊")?.count).toBe(
                2,
            );
            expect(countData.find((d) => d.category === "日常")?.count).toBe(
                1,
            );
            // "cover" 是音樂的 keyword，不應出現
            expect(
                countData.find((d) => d.category === "cover"),
            ).toBeUndefined();
        });

        it("showAllKeywords=false 時同一影片的重複 keyword 去重", () => {
            const dupeVideos = [
                makeVideo({
                    videoId: "v1",
                    matchedPairs: [
                        { main: "雜談", keyword: "閒聊", hitKeywords: [] },
                        { main: "雜談", keyword: "閒聊", hitKeywords: [] },
                    ],
                }),
            ];
            const { countData } = aggregateVideoMetrics(
                dupeVideos,
                "直播檔",
                "雜談",
                false,
            );
            expect(countData.find((d) => d.category === "閒聊")?.count).toBe(
                1,
            );
        });

        it("showAllKeywords=true 時不去重", () => {
            const dupeVideos = [
                makeVideo({
                    videoId: "v1",
                    matchedPairs: [
                        { main: "雜談", keyword: "閒聊", hitKeywords: [] },
                        { main: "雜談", keyword: "閒聊", hitKeywords: [] },
                    ],
                }),
            ];
            const { countData } = aggregateVideoMetrics(
                dupeVideos,
                "直播檔",
                "雜談",
                true,
            );
            expect(countData.find((d) => d.category === "閒聊")?.count).toBe(
                2,
            );
        });

        it("matchedPairs 為 undefined 時不 crash", () => {
            const noMatchVideos = [
                makeVideo({ videoId: "v1", matchedPairs: undefined }),
            ];
            const { countData } = aggregateVideoMetrics(
                noMatchVideos,
                "直播檔",
                "雜談",
            );
            expect(countData).toEqual([]);
        });
    });

    describe("type 篩選", () => {
        it("不同 type 的影片被排除", () => {
            const videos = [
                makeVideo({
                    videoId: "v1",
                    type: "影片" as ClassifiedVideoItem["type"],
                    matchedCategories: ["遊戲"],
                }),
            ];
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "全部",
            );
            expect(countData).toEqual([]);
        });
    });

    describe("邊界情況", () => {
        it("空陣列回傳空結果", () => {
            const result = aggregateVideoMetrics([], "直播檔", "全部");
            expect(result.countData).toEqual([]);
            expect(result.durationData).toEqual([]);
        });

        it("matchedCategories 為 undefined 時安全處理", () => {
            const videos = [
                makeVideo({
                    videoId: "v1",
                    matchedCategories: undefined as unknown as string[],
                }),
            ];
            const { countData } = aggregateVideoMetrics(
                videos,
                "直播檔",
                "全部",
            );
            expect(countData).toEqual([]);
        });
    });
});

// ===== convertDurationUnit =====

describe("convertDurationUnit", () => {
    it("秒轉小時，保留一位小數", () => {
        expect(convertDurationUnit(3600, "hours")).toBe(1.0);
        expect(convertDurationUnit(5400, "hours")).toBe(1.5);
        expect(convertDurationUnit(100, "hours")).toBe(0.0);
    });

    it("秒轉分鐘，四捨五入為整數", () => {
        expect(convertDurationUnit(3600, "minutes")).toBe(60);
        expect(convertDurationUnit(90, "minutes")).toBe(2); // 1.5 → 2
        expect(convertDurationUnit(80, "minutes")).toBe(1); // 1.33 → 1
    });

    it("0 秒回傳 0", () => {
        expect(convertDurationUnit(0, "hours")).toBe(0);
        expect(convertDurationUnit(0, "minutes")).toBe(0);
    });
});
