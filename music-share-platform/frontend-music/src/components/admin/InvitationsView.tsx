import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Invitation, Track } from '../../types';
import { PageTransition } from '../PageTransition';
import { Link as LinkIcon, Check, Copy, Calendar, RefreshCw, Music } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

export function InvitationsView() {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);

    // Create State
    const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
    const [expiresInDays, setExpiresInDays] = useState(30);
    const [creating, setCreating] = useState(false);
    const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tracksRes, invitationsRes] = await Promise.all([
                adminAPI.getTracks(),
                adminAPI.getInvitations(),
            ]);
            setTracks(tracksRes.data.tracks);
            setInvitations(invitationsRes.data.invitations);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async () => {
        if (selectedTracks.length === 0) return alert('최소 하나의 트랙을 선택해주세요.');

        setCreating(true);
        try {
            const res = await adminAPI.createInvitation(selectedTracks, expiresInDays);
            setNewInviteCode(res.data.invitation.code);
            setSelectedTracks([]);
            loadData();
        } catch (error: any) {
            alert('초대 링크 생성 실패: ' + (error.response?.data?.error || error.message));
        } finally {
            setCreating(false);
        }
    };

    const getInviteLink = (code: string) => {
        const baseUrl = import.meta.env.PROD
            ? 'https://frontend-music-livid.vercel.app'
            : 'http://localhost:3002';
        return `${baseUrl}/invite/${code}`;
    };

    const copyInviteLink = (code: string) => {
        const link = getInviteLink(code);
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleTrackSelection = (trackId: string) => {
        setSelectedTracks(prev =>
            prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
        );
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

    return (
        <PageTransition className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>초대 링크</h1>
                    <p className={cn("mt-1", isDark ? "text-white/50" : "text-gray-500")}>접속 링크를 생성하고 관리하세요.</p>
                </div>
                <button
                    onClick={loadData}
                    className={cn(
                        "p-2 transition-colors rounded-full",
                        isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                    )}
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Create Invitation Panel */}
                <div className={cn(
                    "rounded-xl p-6",
                    isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
                )}>
                    <h2 className={cn("text-lg font-semibold mb-6 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                        <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                        )}>
                            <LinkIcon className="w-4 h-4" />
                        </span>
                        새 링크 생성
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className={cn("block text-sm font-medium mb-2", isDark ? "text-white/70" : "text-gray-700")}>
                                트랙 선택 ({selectedTracks.length}개)
                            </label>
                            <div className={cn(
                                "border rounded-lg max-h-60 overflow-y-auto scrollbar-thin",
                                isDark ? "border-white/10" : "border-gray-200"
                            )}>
                                {tracks.length === 0 ? (
                                    <div className={cn("p-4 text-center text-sm", isDark ? "text-white/50" : "text-gray-500")}>사용 가능한 트랙이 없습니다.</div>
                                ) : (
                                    tracks.map(track => (
                                        <label
                                            key={track.id}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0",
                                                isDark ? "border-white/5" : "border-gray-50",
                                                selectedTracks.includes(track.id)
                                                    ? (isDark ? "bg-emerald-500/20" : "bg-emerald-50/50")
                                                    : (isDark ? "hover:bg-white/5" : "hover:bg-gray-50")
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTracks.includes(track.id)}
                                                onChange={() => toggleTrackSelection(track.id)}
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>{track.title}</p>
                                                <p className={cn("text-xs truncate", isDark ? "text-white/50" : "text-gray-500")}>{track.artist}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <label className={cn("block text-sm font-medium mb-2", isDark ? "text-white/70" : "text-gray-700")}>유효 기간</label>
                            <select
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                className={cn(
                                    "w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow",
                                    isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200 text-gray-900"
                                )}
                            >
                                <option value={7}>7일</option>
                                <option value={30}>30일</option>
                                <option value={90}>90일</option>
                                <option value={365}>1년</option>
                            </select>
                        </div>

                        <button
                            onClick={handleCreateInvite}
                            disabled={creating || selectedTracks.length === 0}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : '링크 생성'}
                        </button>
                    </div>

                    {newInviteCode && (
                        <div className={cn(
                            "mt-6 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2",
                            isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-100"
                        )}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn("text-sm font-semibold", isDark ? "text-green-400" : "text-green-800")}>공유 준비 완료!</span>
                                <button
                                    onClick={() => setNewInviteCode(null)}
                                    className={cn("text-xs", isDark ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800")}
                                >
                                    닫기
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className={cn(
                                    "flex-1 border rounded px-3 py-2 text-sm font-mono truncate",
                                    isDark ? "bg-white/5 border-green-500/20 text-green-400" : "bg-white border-green-200 text-green-700"
                                )}>
                                    {getInviteLink(newInviteCode)}
                                </code>
                                <button
                                    onClick={() => copyInviteLink(newInviteCode)}
                                    className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* List Panel */}
                <div className={cn(
                    "rounded-xl p-6 flex flex-col h-[600px]",
                    isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
                )}>
                    <h2 className={cn("text-lg font-semibold mb-6", isDark ? "text-white" : "text-gray-900")}>활성 초대 링크</h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                        {invitations.length === 0 ? (
                            <div className={cn("h-full flex flex-col items-center justify-center", isDark ? "text-white/40" : "text-gray-400")}>
                                <LinkIcon className="w-12 h-12 mb-3 opacity-20" />
                                <p>활성 링크가 없습니다</p>
                            </div>
                        ) : (
                            invitations.map(inv => (
                                <div key={inv.id} className={cn(
                                    "group border rounded-lg p-4 transition-all",
                                    isDark
                                        ? "border-white/10 hover:border-emerald-500/30 hover:bg-white/5"
                                        : "border-gray-100 hover:border-emerald-100 hover:shadow-sm"
                                )}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className={cn("text-sm font-mono font-bold", isDark ? "text-white" : "text-gray-900")}>{inv.code}</code>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                                                    inv.is_used
                                                        ? (isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")
                                                        : (isDark ? "bg-green-500/20 text-green-400" : "bg-green-50 text-green-600")
                                                )}>
                                                    {inv.is_used ? '사용됨' : '활성'}
                                                </span>
                                            </div>
                                            <p className={cn("text-xs flex items-center gap-1.5", isDark ? "text-white/50" : "text-gray-500")}>
                                                <Music className="w-3 h-3" />
                                                {inv.track_count}개 트랙
                                            </p>
                                        </div>

                                        {!inv.is_used && (
                                            <button
                                                onClick={() => copyInviteLink(inv.code)}
                                                className={cn("transition-colors", isDark ? "text-white/40 hover:text-emerald-400" : "text-gray-400 hover:text-emerald-600")}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className={cn("flex items-center justify-between text-xs border-t pt-3", isDark ? "border-white/10" : "border-gray-50")}>
                                        <span className={isDark ? "text-white/40" : "text-gray-400"}>생성일: {formatDate(inv.created_at)}</span>
                                        {inv.expires_at && (
                                            <span className={cn(
                                                "flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                isDark ? "text-amber-400 bg-amber-500/20" : "text-amber-500 bg-amber-50"
                                            )}>
                                                <Calendar className="w-3 h-3" />
                                                만료: {formatDate(inv.expires_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
