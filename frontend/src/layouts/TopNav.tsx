import { Search, Bell, Moon, Sun, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function TopNav({ theme, toggleTheme }: { theme: 'dark' | 'light', toggleTheme: () => void }) {
    const user = useAuthStore(s => s.user);

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-aegis-base border-b border-aegis-border shrink-0">
            {/* Left side (Dashboard Title would go here or be managed by pages) */}
            <div className="flex items-center">
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Global Search */}
                <div className="relative group hidden md:block">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-aegis-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Global Search..." 
                        className="pl-9 pr-4 py-1.5 bg-aegis-surfaceSecondary border border-aegis-border rounded-lg text-sm text-gray-200 w-64 focus:outline-none focus:border-aegis-primary/50 focus:ring-1 focus:ring-aegis-primary/50 transition-all placeholder:text-gray-600"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-medium text-gray-500 bg-aegis-surface border border-aegis-border rounded">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-medium text-gray-500 bg-aegis-surface border border-aegis-border rounded">K</kbd>
                    </div>
                </div>

                <div className="h-6 w-px bg-aegis-border mx-2"></div>

                {/* Icons */}
                <button className="text-gray-400 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-aegis-primary rounded-full border border-aegis-base"></span>
                </button>
                
                <button onClick={toggleTheme} className="text-gray-400 hover:text-white transition-colors">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-aegis-border cursor-pointer group">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{user?.username || 'Analyst'}</span>
                        <span className="text-xs text-gray-500">Tier-1 Investigator</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-aegis-primary/20 border border-aegis-primary/30 flex items-center justify-center text-aegis-primary">
                        <User className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </header>
    );
}
