import { FileSearch, UserX, Network, Clock } from 'lucide-react';

export default function PremiumKpiCards() {
    const kpis = [
        {
            id: 1,
            title: "Active Investigations",
            value: "32",
            trend: "+18%",
            isPositive: false, // More investigations isn't necessarily 'positive' for the bank, but let's make it red
            icon: FileSearch,
            color: "text-aegis-primary",
            bg: "bg-aegis-primary/10"
        },
        {
            id: 2,
            title: "Suspicious Entities",
            value: "128",
            trend: "+22%",
            isPositive: false,
            icon: UserX,
            color: "text-aegis-warning",
            bg: "bg-aegis-warning/10"
        },
        {
            id: 3,
            title: "Fraud Rings Identified",
            value: "05",
            trend: "-2%",
            isPositive: true,
            icon: Network,
            color: "text-aegis-danger",
            bg: "bg-aegis-danger/10"
        },
        {
            id: 4,
            title: "Avg Investigation Time",
            value: "2.4m",
            trend: "-12%",
            isPositive: true,
            icon: Clock,
            color: "text-aegis-secondary",
            bg: "bg-aegis-secondary/10"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi) => (
                <div key={kpi.id} className="glass-panel p-5 relative overflow-hidden group cursor-pointer hover:border-aegis-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">{kpi.title}</span>
                        <div className={`p-2 rounded-lg ${kpi.bg}`}>
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-display font-bold text-white tracking-tight">{kpi.value}</span>
                        <span className={`text-xs font-semibold ${kpi.isPositive ? 'text-aegis-primary' : 'text-aegis-danger'}`}>
                            {kpi.trend} vs last 7d
                        </span>
                    </div>
                    {/* Tiny decorative trend line mock */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-aegis-border to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                </div>
            ))}
        </div>
    );
}
