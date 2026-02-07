import { Link, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Eye, Server, AlertCircle, BarChart3, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { id } = useParams();
    const projectId = id ? parseInt(id) : null;

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const projectNavItems = projectId ? [
        { name: 'Overview', href: `/projects/${projectId}`, icon: BarChart3 },
        { name: 'Error Groups', href: `/projects/${projectId}/error-groups`, icon: AlertCircle },
        { name: 'Environments', href: `/projects/${projectId}/environments`, icon: Server },
        { name: 'Team', href: `/projects/${projectId}/team`, icon: Users },
    ] : [];

    return (
        <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-full">
            <div className="p-6 flex items-center space-x-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                    <Eye size={24} className="text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Vigil Eye
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600/10 text-blue-500'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                {projectId && (
                    <div className="pt-6 mt-6 border-t border-slate-800">
                        <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Project Context</p>
                        {projectNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600/10 text-blue-500'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center space-x-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};
