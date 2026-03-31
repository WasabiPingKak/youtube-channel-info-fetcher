import { sortVideos } from './sortVideos';
import type { VideoItem } from '../types/video';

const videos: VideoItem[] = [
    { videoId: '1', title: 'Banana', publishDate: '2024-01-02' },
    { videoId: '2', title: 'Apple', publishDate: '2024-01-01' },
    { videoId: '3', title: 'Cherry', publishDate: '2024-01-03' },
];

describe('sortVideos', () => {
    it('應依指定欄位升冪排序', () => {
        const result = sortVideos(videos, 'title', 'asc');
        expect(result.map((v) => v.title)).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('應依指定欄位降冪排序', () => {
        const result = sortVideos(videos, 'title', 'desc');
        expect(result.map((v) => v.title)).toEqual(['Cherry', 'Banana', 'Apple']);
    });

    it('應依日期欄位排序', () => {
        const result = sortVideos(videos, 'publishDate', 'asc');
        expect(result.map((v) => v.videoId)).toEqual(['2', '1', '3']);
    });

    it('不應改動原始陣列（non-mutating）', () => {
        const original = [...videos];
        sortVideos(videos, 'title', 'asc');
        expect(videos).toEqual(original);
    });

    it('缺少的欄位應視為空字串處理', () => {
        const videosWithMissing: VideoItem[] = [
            { videoId: '1', title: 'Banana' },
            { videoId: '2' }, // 缺少 title
            { videoId: '3', title: 'Apple' },
        ];
        const result = sortVideos(videosWithMissing, 'title', 'asc');
        // 空字串 < 'Apple' < 'Banana'
        expect(result[0].videoId).toBe('2');
    });

    it('空陣列應回傳空陣列', () => {
        expect(sortVideos([], 'title', 'asc')).toEqual([]);
    });
});
