import { create } from 'zustand';
import { trackAPI, adminAPI } from '../services/api';

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

  // 라이브러리 모드 (트랙 탭에서만 하단 바 표시)
  isLibraryMode: boolean;

  // 프리로드 캐시
  preloadedUrls: Map<string, string>;
  preloadingTracks: Set<string>;

  // 액션
  setAudio: (audio: HTMLAudioElement) => void;
  preloadTrack: (track: Track) => Promise<void>;
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
  setLibraryMode: (mode: boolean) => void;
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
  isLibraryMode: false,
  preloadedUrls: new Map(),
  preloadingTracks: new Set(),

  setAudio: (audio) => {
    console.log('🔊 Audio element registered in store');
    set({ audio });
  },

  // 트랙 프리로드 (URL 캐싱 + Audio 버퍼링)
  preloadTrack: async (track) => {
    const state = get();

    // 이미 프리로드됨 또는 프리로드 중이면 스킵
    if (state.preloadedUrls.has(track.id) || state.preloadingTracks.has(track.id)) {
      return;
    }

    // 프리로드 시작 표시
    state.preloadingTracks.add(track.id);

    try {
      // 로컬스토리지에서 사용자 정보 확인
      const authStorage = localStorage.getItem('auth-storage');
      let isAdmin = false;
      if (authStorage) {
        const { state: authState } = JSON.parse(authStorage);
        isAdmin = authState?.user?.role === 'admin';
      }

      // 스트리밍 URL 가져오기
      const response = isAdmin
        ? await adminAPI.getStreamUrl(track.id)
        : await trackAPI.getStreamUrl(track.id);
      const { streamUrl } = response.data;

      // URL 캐싱
      state.preloadedUrls.set(track.id, streamUrl);

      // Audio 객체로 미리 버퍼링
      const preloadAudio = new Audio();
      preloadAudio.preload = 'auto';
      preloadAudio.src = streamUrl;
      // 로드 시작 (재생하지 않음)
      preloadAudio.load();

      console.log('📦 Preloaded:', track.title);
    } catch (error) {
      console.error('❌ Failed to preload track:', track.title, error);
    } finally {
      state.preloadingTracks.delete(track.id);
    }
  },

  playTrack: async (track, playlist) => {
    const state = get();

    console.log('🎵 playTrack called:', track.title);

    set({ isLoading: true });

    try {
      let streamUrl: string;

      // 트랙에 stream_url이 직접 있으면 바로 사용 (프로젝트 전용 음원 등)
      if ((track as any).stream_url) {
        streamUrl = (track as any).stream_url;
        console.log('⚡ Using direct stream_url from track');
      }
      // 캐시된 URL이 있으면 사용
      else if (state.preloadedUrls.has(track.id)) {
        streamUrl = state.preloadedUrls.get(track.id)!;
        console.log('⚡ Using preloaded URL');
      } else {
        // 캐시가 없으면 새로 가져오기
        console.log('📡 Fetching stream URL for track:', track.id);

        const authStorage = localStorage.getItem('auth-storage');
        let isAdmin = false;
        if (authStorage) {
          const { state: authState } = JSON.parse(authStorage);
          isAdmin = authState?.user?.role === 'admin';
        }

        const response = isAdmin
          ? await adminAPI.getStreamUrl(track.id)
          : await trackAPI.getStreamUrl(track.id);
        streamUrl = response.data.streamUrl;
      }

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
        console.log('✅ Audio playing!');
        set({
          currentTrack: track,
          isPlaying: true,
          isLoading: false,
          currentTime: 0
        });
      } else {
        console.error('❌ Audio element not found in store!');
        set({ isLoading: false });
        throw new Error('Audio element not initialized');
      }
    } catch (error) {
      console.error('❌ Failed to play track:', error);
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
  setLibraryMode: (mode) => {
    const state = get();
    // 라이브러리 모드 해제 시 재생 중지
    if (!mode && state.currentTrack) {
      state.audio?.pause();
      state.audio && (state.audio.currentTime = 0);
      set({ isLibraryMode: mode, isPlaying: false, currentTime: 0, currentTrack: null });
    } else {
      set({ isLibraryMode: mode });
    }
  },
}));
