import type { ReactNode } from 'react';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        // Actual theme toggling logic would apply dark class to HTML root here
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-aegis-base text-gray-300 font-sans">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
                <TopNav theme={theme} toggleTheme={toggleTheme} />
                
                <main className="flex-1 overflow-hidden">
                    <div className="h-full w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
