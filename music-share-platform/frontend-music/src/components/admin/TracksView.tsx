import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Track } from '../../types';
import { PageTransition } from '../PageTransition';
import { Music, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TracksView() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTracks();
    }, []);

    const loadTracks = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getTracks();
            setTracks(res.data.tracks);
        } catch (error) {
            console.error('Failed to load tracks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrack = async (trackId: string) => {
        if (!confirm('이 트랙을 삭제하시겠습니까?')) return;
        try {
            await adminAPI.deleteTrack(trackId);
            loadTracks();
        } catch (error) {
            alert('삭제에 실패했습니다');
        }
    };

    const formatDuration = (sec?: number) => sec ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : '-';
    const formatSize = (bytes?: number) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : '-';
    const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

    return (
        <PageTransition className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">음악 라이브러리</h1>
                    <p className="text-gray-500 mt-1">음악 트랙을 관리하고 정리하세요.</p>
                </div>
                <button
                    onClick={loadTracks}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                {tracks.length === 0 && !loading ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Music className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">트랙이 없습니다</h3>
                        <p className="text-gray-500 mt-1">음악을 업로드하여 시작하세요.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">제목</th>
                                <th className="px-6 py-4 font-medium">아티스트</th>
                                <th className="px-6 py-4 font-medium">앨범</th>
                                <th className="px-6 py-4 font-medium">재생 시간</th>
                                <th className="px-6 py-4 font-medium">크기</th>
                                <th className="px-6 py-4 font-medium">날짜</th>
                                <th className="px-6 py-4 font-medium w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tracks.map((track) => (
                                <tr key={track.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-600">
                                                <Music className="w-4 h-4" />
                                            </div>
                                            {track.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{track.artist}</td>
                                    <td className="px-6 py-4 text-gray-600">{track.album || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatDuration(track.duration)}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatSize(track.file_size)}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatDate(track.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                            <button
                                                onClick={() => handleDeleteTrack(track.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PageTransition>
    );
}
