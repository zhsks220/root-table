import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { User } from '../../types';
import { PageTransition } from '../PageTransition';
import { Users, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function UsersView() {
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">팀 멤버</h1>
                    <p className="text-gray-500 mt-1">사용자 및 권한을 관리하세요.</p>
                </div>
                <button
                    onClick={loadUsers}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                {users.length === 0 && !loading ? (
                    <div className="p-16 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">사용자가 없습니다</h3>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">이름</th>
                                <th className="px-6 py-4 font-medium">이메일</th>
                                <th className="px-6 py-4 font-medium">역할</th>
                                <th className="px-6 py-4 font-medium">할당된 트랙</th>
                                <th className="px-6 py-4 font-medium">가입일</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                {u.name[0]}
                                            </div>
                                            {u.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                            u.role === 'admin'
                                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                                : "bg-gray-50 text-gray-600 border-gray-100"
                                        )}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{u.track_count}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatDate(u.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PageTransition>
    );
}
