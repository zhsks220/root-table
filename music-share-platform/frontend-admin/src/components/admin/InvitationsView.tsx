import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Invitation, Track } from '../../types';
import { PageTransition } from '../PageTransition';
import { Link as LinkIcon, Check, Copy, Calendar, RefreshCw, Music } from 'lucide-react';
import { cn } from '../../lib/utils';

export function InvitationsView() {
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
        if (selectedTracks.length === 0) return alert('Please select at least one track.');

        setCreating(true);
        try {
            const res = await adminAPI.createInvitation(selectedTracks, expiresInDays);
            setNewInviteCode(res.data.invitation.code);
            setSelectedTracks([]);
            loadData();
        } catch (error: any) {
            alert('Failed to create invitation: ' + (error.response?.data?.error || error.message));
        } finally {
            setCreating(false);
        }
    };

    const copyInviteLink = (code: string) => {
        const link = `http://localhost:3002/invite/${code}`;
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invitations</h1>
                    <p className="text-gray-500 mt-1">Create and manage access links.</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Create Invitation Panel */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <LinkIcon className="w-4 h-4" />
                        </span>
                        Create New Link
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Tracks ({selectedTracks.length})
                            </label>
                            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto scrollbar-thin">
                                {tracks.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No tracks available.</div>
                                ) : (
                                    tracks.map(track => (
                                        <label
                                            key={track.id}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0 border-gray-50",
                                                selectedTracks.includes(track.id) ? "bg-indigo-50/50" : "hover:bg-gray-50"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTracks.includes(track.id)}
                                                onChange={() => toggleTrackSelection(track.id)}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{track.title}</p>
                                                <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration</label>
                            <select
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                            >
                                <option value={7}>7 Days</option>
                                <option value={30}>30 Days</option>
                                <option value={90}>90 Days</option>
                                <option value={365}>1 Year</option>
                            </select>
                        </div>

                        <button
                            onClick={handleCreateInvite}
                            disabled={creating || selectedTracks.length === 0}
                            className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generating Link'}
                        </button>
                    </div>

                    {newInviteCode && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-green-800">Ready to share!</span>
                                <button
                                    onClick={() => setNewInviteCode(null)}
                                    className="text-green-600 hover:text-green-800 text-xs"
                                >
                                    Dismiss
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white border border-green-200 rounded px-3 py-2 text-sm font-mono text-green-700 truncate">
                                    http://localhost:3002/invite/{newInviteCode}
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
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col h-[600px]">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Active Invitations</h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                        {invitations.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <LinkIcon className="w-12 h-12 mb-3 opacity-20" />
                                <p>No active links</p>
                            </div>
                        ) : (
                            invitations.map(inv => (
                                <div key={inv.id} className="group border border-gray-100 hover:border-indigo-100 rounded-lg p-4 transition-all hover:shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="text-sm font-mono font-bold text-gray-900">{inv.code}</code>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                                                    inv.is_used ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-600"
                                                )}>
                                                    {inv.is_used ? 'USED' : 'ACTIVE'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <Music className="w-3 h-3" />
                                                {inv.track_count} tracks
                                            </p>
                                        </div>

                                        {!inv.is_used && (
                                            <button
                                                onClick={() => copyInviteLink(inv.code)}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
                                        <span className="text-gray-400">Created {formatDate(inv.created_at)}</span>
                                        {inv.expires_at && (
                                            <span className="flex items-center gap-1 text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">
                                                <Calendar className="w-3 h-3" />
                                                Exp: {formatDate(inv.expires_at)}
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
