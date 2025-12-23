import { create } from 'zustand';
import { trackAPI } from '../services/api';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

interface PlayerState {
  // 현재 트랙 정보
  currentTrack: Track | null;
  playlist: Track[];
  currentIndex: number;

  // 재생 상태
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Audio 엘리먼트 참조
  audio: HTMLAudioElement | null;

  // 액션
  setAudio: (audio: HTMLAudioElement) => void;
  playTrack: (track: Track, playlist?: Track[]) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  updateTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playlist: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  audio: null,

  setAudio: (audio) => set({ audio }),

  playTrack: async (track, playlist) => {
    const state = get();

    set({ isLoading: true });

    try {
      // 스트리밍 URL 가져오기
      const response = await trackAPI.getStreamUrl(track.id);
      const { streamUrl } = response.data;

      // 플레이리스트 설정
      if (playlist) {
        const index = playlist.findIndex(t => t.id === track.id);
        set({ playlist, currentIndex: index });
      }

      // 오디오 재생
      if (state.audio) {
        state.audio.src = streamUrl;
        state.audio.load();
        await state.audio.play();
        set({
          currentTrack: track,
          isPlaying: true,
          isLoading: false,
          currentTime: 0
        });
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  togglePlay: () => {
    const state = get();
    if (state.audio) {
      if (state.isPlaying) {
        state.audio.pause();
        set({ isPlaying: false });
      } else {
        state.audio.play();
        set({ isPlaying: true });
      }
    }
  },

  pause: () => {
    const state = get();
    if (state.audio) {
      state.audio.pause();
      set({ isPlaying: false });
    }
  },

  resume: () => {
    const state = get();
    if (state.audio) {
      state.audio.play();
      set({ isPlaying: true });
    }
  },

  stop: () => {
    const state = get();
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      set({ isPlaying: false, currentTime: 0, currentTrack: null });
    }
  },

  next: () => {
    const state = get();
    if (state.playlist.length > 0 && state.currentIndex < state.playlist.length - 1) {
      const nextTrack = state.playlist[state.currentIndex + 1];
      set({ currentIndex: state.currentIndex + 1 });
      get().playTrack(nextTrack);
    }
  },

  previous: () => {
    const state = get();
    // 3초 이상 재생되었으면 처음으로, 아니면 이전 트랙
    if (state.currentTime > 3) {
      if (state.audio) {
        state.audio.currentTime = 0;
        set({ currentTime: 0 });
      }
    } else if (state.playlist.length > 0 && state.currentIndex > 0) {
      const prevTrack = state.playlist[state.currentIndex - 1];
      set({ currentIndex: state.currentIndex - 1 });
      get().playTrack(prevTrack);
    }
  },

  seek: (time) => {
    const state = get();
    if (state.audio) {
      state.audio.currentTime = time;
      set({ currentTime: time });
    }
  },

  setVolume: (volume) => {
    const state = get();
    if (state.audio) {
      state.audio.volume = volume;
      set({ volume, isMuted: volume === 0 });
    }
  },

  toggleMute: () => {
    const state = get();
    if (state.audio) {
      if (state.isMuted) {
        state.audio.volume = state.volume || 1;
        set({ isMuted: false });
      } else {
        state.audio.volume = 0;
        set({ isMuted: true });
      }
    }
  },

  updateTime: (time) => set({ currentTime: time }),
  updateDuration: (duration) => set({ duration }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
