import { Music, Link as LinkIcon, Users, Upload, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
}

export function LoopsSidebar({ activeTab, onTabChange }: SidebarProps) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { id: 'tracks', label: 'Tracks', icon: Music },
        { id: 'invitations', label: 'Invitations', icon: LinkIcon },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'upload', label: 'Upload Track', icon: Upload },
    ];

    return (
        <aside className="w-64 bg-[#fbfbfb] border-r border-gray-100 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">ROUTELABEL</span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === item.id
                                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-orange-500" : "text-gray-400")} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
                <p className="mt-4 text-xs text-gray-400 px-2">v1.0.0 • Admin Console</p>
            </div>
        </aside>
    );
}
