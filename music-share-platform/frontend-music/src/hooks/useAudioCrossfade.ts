import { useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';

interface CrossfadeOptions {
  duration?: number; // crossfade 지속 시간 (ms)
  volume?: number;   // 기본 볼륨 (0-1)
}

interface AudioCrossfadeManager {
  play: (url: string, options?: { crossfade?: boolean }) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isPlaying: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  seek: (time: number) => void;
  onTimeUpdate: (callback: (time: number) => void) => void;
  onEnd: (callback: () => void) => void;
  onLoad: (callback: () => void) => void;
}

export function useAudioCrossfade(options: CrossfadeOptions = {}): AudioCrossfadeManager {
  const { duration = 1000, volume: defaultVolume = 1 } = options;

  const currentHowlRef = useRef<Howl | null>(null);
  const volumeRef = useRef(defaultVolume);
  const timeUpdateCallbackRef = useRef<((time: number) => void) | null>(null);
  const endCallbackRef = useRef<(() => void) | null>(null);
  const loadCallbackRef = useRef<(() => void) | null>(null);
  const timeUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 시간 업데이트 인터벌 정리
  const clearTimeUpdateInterval = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  // 시간 업데이트 인터벌 시작
  const startTimeUpdateInterval = useCallback(() => {
    clearTimeUpdateInterval();
    timeUpdateIntervalRef.current = setInterval(() => {
      if (currentHowlRef.current && currentHowlRef.current.playing()) {
        const time = currentHowlRef.current.seek() as number;
        timeUpdateCallbackRef.current?.(time);
      }
    }, 250); // 250ms 간격으로 업데이트
  }, [clearTimeUpdateInterval]);

  // Crossfade 재생
  const play = useCallback(async (url: string, playOptions?: { crossfade?: boolean }) => {
    const shouldCrossfade = playOptions?.crossfade ?? true;

    return new Promise<void>((resolve, reject) => {
      // 새 사운드 생성
      const newSound = new Howl({
        src: [url],
        html5: true, // 스트리밍을 위해 html5 모드 사용
        volume: shouldCrossfade ? 0 : volumeRef.current,
        onload: () => {
          loadCallbackRef.current?.();
        },
        onplay: () => {
          startTimeUpdateInterval();
          resolve();
        },
        onend: () => {
          clearTimeUpdateInterval();
          endCallbackRef.current?.();
        },
        onloaderror: (_id, error) => {
          console.error('Audio load error:', error);
          reject(error);
        },
        onplayerror: (_id, error) => {
          console.error('Audio play error:', error);
          reject(error);
        },
      });

      // 이전 사운드 페이드아웃
      if (currentHowlRef.current && shouldCrossfade) {
        const oldSound = currentHowlRef.current;
        oldSound.fade(oldSound.volume(), 0, duration);

        setTimeout(() => {
          oldSound.stop();
          oldSound.unload();
        }, duration);
      } else if (currentHowlRef.current) {
        // crossfade 없이 즉시 정지
        currentHowlRef.current.stop();
        currentHowlRef.current.unload();
      }

      // 새 사운드 재생 및 페이드인
      newSound.play();

      if (shouldCrossfade) {
        newSound.fade(0, volumeRef.current, duration);
      }

      currentHowlRef.current = newSound;
    });
  }, [duration, startTimeUpdateInterval, clearTimeUpdateInterval]);

  // 일시정지
  const pause = useCallback(() => {
    if (currentHowlRef.current) {
      currentHowlRef.current.pause();
      clearTimeUpdateInterval();
    }
  }, [clearTimeUpdateInterval]);

  // 재생 재개
  const resume = useCallback(() => {
    if (currentHowlRef.current) {
      currentHowlRef.current.play();
      startTimeUpdateInterval();
    }
  }, [startTimeUpdateInterval]);

  // 정지
  const stop = useCallback(() => {
    if (currentHowlRef.current) {
      currentHowlRef.current.stop();
      clearTimeUpdateInterval();
    }
  }, [clearTimeUpdateInterval]);

  // 볼륨 설정
  const setVolume = useCallback((vol: number) => {
    volumeRef.current = vol;
    if (currentHowlRef.current) {
      currentHowlRef.current.volume(vol);
    }
  }, []);

  // 볼륨 가져오기
  const getVolume = useCallback(() => {
    return volumeRef.current;
  }, []);

  // 재생 중인지 확인
  const isPlaying = useCallback(() => {
    return currentHowlRef.current?.playing() ?? false;
  }, []);

  // 현재 시간 가져오기
  const getCurrentTime = useCallback(() => {
    return (currentHowlRef.current?.seek() as number) ?? 0;
  }, []);

  // 전체 길이 가져오기
  const getDuration = useCallback(() => {
    return currentHowlRef.current?.duration() ?? 0;
  }, []);

  // 시간 이동
  const seek = useCallback((time: number) => {
    if (currentHowlRef.current) {
      currentHowlRef.current.seek(time);
    }
  }, []);

  // 시간 업데이트 콜백 등록
  const onTimeUpdate = useCallback((callback: (time: number) => void) => {
    timeUpdateCallbackRef.current = callback;
  }, []);

  // 재생 종료 콜백 등록
  const onEnd = useCallback((callback: () => void) => {
    endCallbackRef.current = callback;
  }, []);

  // 로드 완료 콜백 등록
  const onLoad = useCallback((callback: () => void) => {
    loadCallbackRef.current = callback;
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      clearTimeUpdateInterval();
      if (currentHowlRef.current) {
        currentHowlRef.current.unload();
        currentHowlRef.current = null;
      }
    };
  }, [clearTimeUpdateInterval]);

  return {
    play,
    pause,
    resume,
    stop,
    setVolume,
    getVolume,
    isPlaying,
    getCurrentTime,
    getDuration,
    seek,
    onTimeUpdate,
    onEnd,
    onLoad,
  };
}
