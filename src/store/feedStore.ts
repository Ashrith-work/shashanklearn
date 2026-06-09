import { create } from 'zustand';
import type { FeedVideo } from '@/types';

/**
 * Feed state. Holds the loaded feed (from the `feed_videos` view) and the
 * currently active card index, shared across feed components + the player.
 */
interface FeedState {
  videos: FeedVideo[];
  activeIndex: number;
  setVideos: (videos: FeedVideo[]) => void;
  setActiveIndex: (index: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  videos: [],
  activeIndex: 0,
  setVideos: (videos) => set({ videos }),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
}));
