import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
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
  [key: string]: any;
}

export function useVideoCache() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categorySettings, setCategorySettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [videosSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, `channel_data/${CHANNEL_ID}/videos`)),
          getDoc(doc(db, `channel_data/${CHANNEL_ID}/settings/config`)),
        ]);

        const fetchedVideos: VideoItem[] = videosSnap.docs.map((doc) => ({
          videoId: doc.id,
          ...doc.data(),
        })) as VideoItem[];

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;

        setVideos(fetchedVideos);
        setCategorySettings(settingsData);
      } catch (err) {
        console.error("[useVideoCache] Failed to fetch data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { videos, categorySettings, loading, error };
}
