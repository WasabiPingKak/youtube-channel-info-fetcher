import type { Video, CategorySettings } from '../../types/editor';
import { generateBadgesForVideo } from './badgeUtils';

export function populateBadges(videos: Video[], config: CategorySettings): Video[] {
  if (!videos.length || !Object.keys(config).length) return videos;

  return videos.map((video) =>
    video.badges?.length ? video : { ...video, badges: generateBadgesForVideo(video, config) }
  );
}
