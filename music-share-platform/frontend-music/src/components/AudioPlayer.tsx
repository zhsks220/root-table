import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  Music,
  X
} from 'lucide-react';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    playlist,
    currentIndex,
    isLibraryMode,
    setAudio,
    togglePlay,
    stop,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    updateTime,
    updateDuration,
    setLoading,
    pause,
  } = usePlayerStore();

  // Audio 엘리먼트 등록
  useEffect(() => {
    if (audioRef.current) {
      setAudio(audioRef.current);
    }
  }, [setAudio]);

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => updateTime(audio.currentTime);
    const handleDurationChange = () => updateDuration(audio.duration);
    const handleEnded = () => next();
    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleError = () => {
      console.error('Audio error:', audio.error);
      setLoading(false);
      pause();
    };
    const handlePause = () => {
      // 외부 요인(전화, 탭 전환 등)으로 일시정지된 경우 상태 동기화
      // ended 이벤트가 아닌 경우에만 pause 상태로 변경
      if (!audio.ended) {
        pause();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
    };
  }, [updateTime, updateDuration, next, setLoading, pause]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // audio 요소는 항상 렌더링되어야 함 (플레이어 초기화 위해)
  // UI는 트랙이 있을 때만 표시
  return (
    <>
      {/* 숨겨진 오디오 엘리먼트 - 항상 렌더링 */}
      <audio ref={audioRef} preload="metadata" />

      {/* 하단 고정 플레이어 - 트랙 라이브러리 탭에서만 표시 */}
      {currentTrack && isLibraryMode && (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-2xl border-t border-gray-700 z-50">
        {/* 진행 바 (상단) */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gray-700 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent * duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: '-6px' }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
          {/* 트랙 정보 */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-white truncate">{currentTrack.title}</h4>
              <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* 컨트롤 */}
          <div className="flex items-center space-x-4">
            {/* 이전 트랙 */}
            <button
              onClick={previous}
              disabled={currentIndex <= 0}
              className="p-2 hover:bg-gray-700 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* 재생/일시정지 */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-12 h-12 bg-white text-gray-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            {/* 다음 트랙 */}
            <button
              onClick={next}
              disabled={currentIndex >= playlist.length - 1}
              className="p-2 hover:bg-gray-700 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* 시간 & 볼륨 */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {/* 시간 표시 */}
            <div className="text-sm text-gray-400 hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-gray-700 rounded-full transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hidden sm:block
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={stop}
              className="p-2 hover:bg-gray-700 rounded-full transition ml-2"
              title="플레이어 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
