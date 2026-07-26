import { Link, useLocation } from 'react-router-dom';
import { Shield, Home, Search, Share2, Folder, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (c: boolean) => void }) {
    const location = useLocation();
    const logout = useAuthStore(s => s.logout);

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/investigations', icon: Search, label: 'Investigations' },
        { path: '/network', icon: Share2, label: 'Entity Network' },
        { path: '/cases', icon: Folder, label: 'Case Manager' },
        { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    ];

    return (
        <aside className={`flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} bg-aegis-surface border-r border-aegis-border h-full`}>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-aegis-border">
                <Shield className="w-8 h-8 text-aegis-primary flex-shrink-0" />
                {!collapsed && (
                    <span className="ml-3 text-lg font-display font-semibold text-white tracking-wide whitespace-nowrap">
                        AegisAML
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
                {navItems.map(item => {
                    const active = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${active ? 'bg-aegis-primary/10 text-aegis-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-aegis-primary' : 'text-gray-400 group-hover:text-white'}`} />
                            {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap">{item.label}</span>}
                        </Link>
                    );
                })}

                <div className="my-4 border-t border-aegis-border mx-3"></div>

                <Link to="/settings" className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${location.pathname === '/settings' ? 'bg-aegis-primary/10 text-aegis-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} title={collapsed ? "Settings" : undefined}>
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap">Settings</span>}
                </Link>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-aegis-border flex flex-col gap-2">
                <button onClick={logout} className="flex items-center px-3 py-2.5 rounded-lg text-gray-400 hover:text-aegis-danger hover:bg-white/5 transition-colors" title={collapsed ? "Sign Out" : undefined}>
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap">Sign Out</span>}
                </button>
                <button 
                    onClick={() => setCollapsed(!collapsed)} 
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-aegis-surfaceSecondary border border-aegis-border self-center hover:bg-white/10 transition-colors mt-2 text-gray-400 hover:text-white"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </aside>
    );
}
