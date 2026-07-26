import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Activity, FileSearch, Share2, Server, Settings, LogOut, FileCode } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const location = useLocation();
    const logout = useAuthStore(s => s.logout);

    const navItems = [
        { path: '/', icon: Activity, label: 'Dashboard' },
        { path: '/investigations', icon: FileSearch, label: 'Investigations' },
        { path: '/new', icon: Shield, label: 'New Case' },
        { path: '/evidence', icon: FileCode, label: 'Evidence Vault' },
        { path: '/graph', icon: Share2, label: 'Graph Explorer' },
        { path: '/health', icon: Server, label: 'Platform Health' },
        { path: '/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-soc-bg text-slate-300 font-sans">
            {/* Sidebar */}
            <aside className="w-64 glass-panel m-4 flex flex-col justify-between">
                <div>
                    <div className="p-6 flex items-center space-x-3 text-brand">
                        <Shield className="w-8 h-8" />
                        <h1 className="text-xl font-bold tracking-wider">AEGIS<span className="text-slate-100">AML</span></h1>
                    </div>
                    <nav className="mt-6 px-4 space-y-2">
                        {navItems.map(item => {
                            const active = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-brand/20 text-brand font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}>
                                    <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-brand' : 'text-slate-400'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="p-4 border-t border-soc-border">
                    <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden p-4 pl-0">
                <header className="glass-panel w-full h-16 flex items-center justify-between px-6 mb-4">
                    <div className="text-lg font-medium tracking-wide">SOC Analyst Console</div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm text-slate-400">Gateway Connected</span>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
