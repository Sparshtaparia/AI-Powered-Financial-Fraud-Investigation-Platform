import { useInvestigationStore } from '../store/investigationStore'
import { CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react'

export default function InvestigationDetails() {
    const { caseData } = useInvestigationStore();

    if (!caseData) {
        return <div className="text-center mt-20 text-slate-400">No active investigation loaded.</div>;
    }

    const riskLabel = caseData.summary?.risk?.label || "UNKNOWN";
    const riskScore = caseData.summary?.risk?.risk || 0;
    const isHigh = riskLabel === 'HIGH';

    return (
        <div className="h-full flex flex-col space-y-4 pb-4">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">{caseData.case_id}</h1>
                    <p className="text-slate-400 font-mono mt-1">Target: CUST_521 | Status: {caseData.status}</p>
                </div>
                <div className={`px-4 py-2 rounded-full border ${isHigh ? 'bg-red-900/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-green-900/20 border-green-500/50 text-green-500'}`}>
                    <span className="font-bold flex items-center">
                        {isHigh ? <ShieldAlert className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                        RISK LEVEL: {riskLabel} ({(riskScore * 100).toFixed(1)}%)
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-4 flex-1 h-full min-h-0">
                {/* Left Col: Timeline */}
                <div className="col-span-3 glass-panel p-4 overflow-y-auto">
                    <h2 className="text-lg font-medium border-b border-soc-border pb-2 mb-4">Execution Timeline</h2>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                        {caseData.summary?.audit?.[0]?.errors?.length > 0 ? (
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-red-500 bg-red-900/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded border border-red-500/30">
                                    <div className="font-bold text-slate-100">Partial Failure</div>
                                    <div className="text-slate-400 text-sm mt-1">{caseData.summary.audit[0].errors[0]}</div>
                                </div>
                            </div>
                        ) : null}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-green-500 bg-green-900/50 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded">
                                <div className="font-bold text-slate-100">Orchestration Complete</div>
                                <div className="text-slate-400 text-sm mt-1">Planner executed all capabilities successfully.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Col: Graph */}
                <div className="col-span-6 glass-panel p-4 flex flex-col">
                    <h2 className="text-lg font-medium border-b border-soc-border pb-2 mb-4">Graph Topology</h2>
                    <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 italic">
                        (Neo4j Render Canvas)
                    </div>
                </div>

                {/* Right Col: Evidence & Actions */}
                <div className="col-span-3 glass-panel p-4 flex flex-col space-y-4">
                    <h2 className="text-lg font-medium border-b border-soc-border pb-2">Evidence Commit</h2>
                    <div className="bg-slate-900 rounded p-4 border border-slate-700 font-mono text-xs overflow-hidden break-all text-slate-300">
                        <strong>Merkle Root:</strong><br/>
                        {caseData.summary?.evidence?.merkle_root || 'N/A'}
                    </div>
                    <h2 className="text-lg font-medium border-b border-soc-border pb-2 mt-4">Recommendations</h2>
                    <div className="text-sm text-slate-300 space-y-2">
                        {caseData.summary?.recommendations?.map((r: string, i: number) => (
                            <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700">{r}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
