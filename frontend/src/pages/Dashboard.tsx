import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
    return (
        <div className="h-full space-y-6">
            <div className="grid grid-cols-4 gap-6">
                <MetricCard title="Active Cases" value="24" icon={Activity} color="text-brand" />
                <MetricCard title="High Risk Alerts" value="7" icon={AlertTriangle} color="text-red-500" />
                <MetricCard title="Avg Latency" value="1.2s" icon={Clock} color="text-yellow-500" />
                <MetricCard title="System Health" value="100%" icon={CheckCircle} color="text-green-500" />
            </div>

            <div className="grid grid-cols-3 gap-6 h-96">
                <div className="col-span-2 glass-panel p-6">
                    <h2 className="text-lg font-semibold mb-4 text-slate-200 border-b border-soc-border pb-2">Recent Investigations</h2>
                    {/* Placeholder for table */}
                    <div className="text-slate-400 text-sm italic mt-10 text-center">Awaiting data pipeline...</div>
                </div>
                <div className="glass-panel p-6">
                    <h2 className="text-lg font-semibold mb-4 text-slate-200 border-b border-soc-border pb-2">Planner Events</h2>
                    <div className="text-slate-400 text-sm italic mt-10 text-center">Stream idle...</div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({title, value, icon: Icon, color}: any) {
    return (
        <div className="glass-panel p-6 flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
                <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
            </div>
            <div className={`p-4 rounded-full bg-slate-800/50 ${color}`}>
                <Icon className="w-8 h-8" />
            </div>
        </div>
    )
}
