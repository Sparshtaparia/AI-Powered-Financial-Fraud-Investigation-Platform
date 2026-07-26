import { ArrowRight, ChevronDown } from 'lucide-react';

export default function RecentInvestigationsTable() {
    const cases = [
        { id: "CASE-82028CDF", subject: "CUST_521", type: "Structuring", risk: 95, status: "In Progress", updated: "2 min ago" },
        { id: "CASE-1049AB22", subject: "CUST_882", type: "High Velocity", risk: 72, status: "In Progress", updated: "15 min ago" },
        { id: "CASE-44021XX9", subject: "CUST_104", type: "Mule Account", risk: 91, status: "Pending", updated: "1 hr ago" },
        { id: "CASE-99210BBA", subject: "CUST_771", type: "Structuring", risk: 65, status: "Completed", updated: "3 hr ago" },
    ];

    const getRiskBadge = (score: number) => {
        if (score >= 90) return <span className="flex items-center gap-1 text-aegis-danger font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-aegis-danger"></span> {score}</span>;
        if (score >= 70) return <span className="flex items-center gap-1 text-aegis-warning font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-aegis-warning"></span> {score}</span>;
        return <span className="flex items-center gap-1 text-yellow-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> {score}</span>;
    };

    const getStatusBadge = (status: string) => {
        if (status === 'In Progress') return <span className="px-2.5 py-1 text-xs font-medium bg-aegis-primary/10 text-aegis-primary border border-aegis-primary/20 rounded">In Progress</span>;
        if (status === 'Pending') return <span className="px-2.5 py-1 text-xs font-medium bg-aegis-warning/10 text-aegis-warning border border-aegis-warning/20 rounded">Pending</span>;
        if (status === 'Completed') return <span className="px-2.5 py-1 text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded">Completed</span>;
        return null;
    };

    return (
        <div className="glass-panel w-full">
            <div className="p-6 border-b border-aegis-border flex justify-between items-center">
                <h3 className="text-lg font-display font-semibold text-white">Recent Investigations</h3>
                <button className="text-sm font-medium text-aegis-primary hover:text-emerald-400 transition-colors">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-aegis-border text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 flex items-center gap-1">Risk Score <ChevronDown className="w-3 h-3" /></th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Updated</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-aegis-border">
                        {cases.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                <td className="px-6 py-4 text-sm font-medium text-gray-300">{c.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-300 flex items-center gap-2">
                                    {c.subject} 
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-aegis-purple/10 text-aegis-purple border border-aegis-purple/20">Customer</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">{c.type}</td>
                                <td className="px-6 py-4 text-sm">{getRiskBadge(c.risk)}</td>
                                <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.updated}</td>
                                <td className="px-6 py-4 text-right">
                                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
