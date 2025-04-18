import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

export interface VideoItem {
  videoId: string;
  title: string;
  publishDate: string;
  duration: number;
  game?: string;
  matchedKeywords?: string[];
  matchedCategories?: string[];
  [key: string]: any; // 為了保險起見，保留擴充欄位
}

export function useVideoCache() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          collection(db, `channel_data/${CHANNEL_ID}/videos`)
        );
        const fetchedVideos: VideoItem[] = snapshot.docs.map((doc) => ({
          videoId: doc.id,
          ...doc.data(),
        })) as VideoItem[];

        setVideos(fetchedVideos);
      } catch (err) {
        console.error("[useVideoCache] Failed to fetch videos:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return { videos, loading, error };
}
