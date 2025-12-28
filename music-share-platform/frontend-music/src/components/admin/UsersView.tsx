import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { User } from '../../types';
import { PageTransition } from '../PageTransition';
import { Users, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

export function UsersView() {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getUsers();
            setUsers(res.data.users);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

    return (
        <PageTransition className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>팀 멤버</h1>
                    <p className={cn("mt-1", isDark ? "text-white/50" : "text-gray-500")}>사용자 및 권한을 관리하세요.</p>
                </div>
                <button
                    onClick={loadUsers}
                    className={cn(
                        "p-2 transition-colors rounded-full",
                        isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                    )}
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className={cn(
                "rounded-xl overflow-hidden",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
            )}>
                {users.length === 0 && !loading ? (
                    <div className="p-16 text-center">
                        <Users className={cn("w-12 h-12 mx-auto mb-4", isDark ? "text-white/20" : "text-gray-300")} />
                        <h3 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>사용자가 없습니다</h3>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className={cn("border-b", isDark ? "bg-white/5 text-white/50 border-white/10" : "bg-gray-50/50 text-gray-500 border-gray-100")}>
                            <tr>
                                <th className="px-6 py-4 font-medium">이름</th>
                                <th className="px-6 py-4 font-medium">이메일</th>
                                <th className="px-6 py-4 font-medium">역할</th>
                                <th className="px-6 py-4 font-medium">할당된 트랙</th>
                                <th className="px-6 py-4 font-medium">가입일</th>
                            </tr>
                        </thead>
                        <tbody className={cn("divide-y", isDark ? "divide-white/10" : "divide-gray-100")}>
                            {users.map((u) => (
                                <tr key={u.id} className={cn("group transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-50/50")}>
                                    <td className={cn("px-6 py-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                                isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                                            )}>
                                                {u.name[0]}
                                            </div>
                                            {u.name}
                                        </div>
                                    </td>
                                    <td className={cn("px-6 py-4", isDark ? "text-white/70" : "text-gray-600")}>{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                            u.role === 'admin'
                                                ? (isDark ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-50 text-purple-700 border-purple-100")
                                                : (isDark ? "bg-white/10 text-white/60 border-white/10" : "bg-gray-50 text-gray-600 border-gray-100")
                                        )}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className={cn("px-6 py-4 font-mono text-xs", isDark ? "text-white/70" : "text-gray-600")}>{u.track_count}</td>
                                    <td className={cn("px-6 py-4", isDark ? "text-white/70" : "text-gray-600")}>{formatDate(u.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PageTransition>
    );
}
