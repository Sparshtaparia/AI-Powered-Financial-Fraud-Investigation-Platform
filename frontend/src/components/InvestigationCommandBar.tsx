import { Sparkles, ArrowRight, Activity, Users, AlertTriangle, ArrowDownUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '../api/client';
import { useInvestigationStore } from '../store/investigationStore';

export default function InvestigationCommandBar() {
    const [query, setQuery] = useState('');
    const { isInvestigating, setIsInvestigating, setCurrentCase } = useInvestigationStore();

    const handleInvestigate = async () => {
        if (!query.trim()) return;
        
        // Extract customer ID if they just typed it, else fallback to CUST_521
        const customerId = query.toUpperCase().match(/CUST_\d+/) ? query.toUpperCase().match(/CUST_\d+/)![0] : 'CUST_521';

        setIsInvestigating(true);
        setCurrentCase('', null); // Clear old data

        try {
            const res = await apiClient.post('/investigate', { customer_id: customerId, query });
            setCurrentCase(res.data.case_id, res.data);
        } catch (err) {
            console.error(err);
            // In a real app we'd handle error state here
        } finally {
            setIsInvestigating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInvestigate();
        }
    };

    const suggestions = [
        { icon: Users, label: "Investigate Customer" },
        { icon: Activity, label: "Find Connected Accounts" },
        { icon: AlertTriangle, label: "Top Risky Merchants" },
        { icon: ArrowDownUp, label: "Large Cash Transactions" },
    ];

    return (
        <div className="glass-panel p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-aegis-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-aegis-primary" />
                <h2 className="text-xl font-display font-medium text-white tracking-wide">Start a new investigation</h2>
            </div>
            
            <div className="w-full max-w-4xl relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-aegis-primary/20 via-aegis-secondary/20 to-aegis-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center bg-aegis-base border border-aegis-border rounded-2xl overflow-hidden focus-within:border-aegis-primary/50 focus-within:ring-1 focus-within:ring-aegis-primary/50 transition-all">
                    <div className="pl-6 pr-4 py-5 flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isInvestigating}
                            placeholder="Investigate customer CUST_521 for possible structuring in the last 90 days..."
                            className="w-full bg-transparent border-none outline-none text-lg text-white placeholder:text-gray-500 font-sans disabled:opacity-50"
                        />
                    </div>
                    <div className="pr-4 py-3">
                        <button 
                            onClick={handleInvestigate}
                            disabled={isInvestigating || !query.trim()}
                            className="bg-aegis-primary hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 text-aegis-base font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
                        >
                            {isInvestigating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Analyze
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setQuery(s.label)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-aegis-surfaceSecondary border border-aegis-border hover:bg-white/5 hover:border-white/10 transition-colors text-sm text-gray-300">
                        <s.icon className="w-4 h-4 text-gray-400" />
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
