import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react';
import { useInvestigationStore } from '../store/investigationStore';

export default function InvestigationOverview() {
    const { caseData, isInvestigating, currentCaseId } = useInvestigationStore();

    if (!caseData && !isInvestigating) return null;

    const riskScore = caseData ? Math.round(caseData.summary.risk.risk_score * 100) : 0;
    const isHighRisk = riskScore >= 75;

    return (
        <div className="glass-panel p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-display font-semibold text-white">Investigation Overview</h3>
                    <p className="text-sm text-gray-500 mt-1">Currently analyzing target entity.</p>
                </div>
                {caseData && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${isHighRisk ? 'bg-aegis-danger/10 border-aegis-danger/20 text-aegis-danger' : 'bg-aegis-primary/10 border-aegis-primary/20 text-aegis-primary'}`}>
                        {isHighRisk ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
                    </div>
                )}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-aegis-surfaceSecondary border border-aegis-border">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <Fingerprint className="w-4 h-4" /> Customer
                    </div>
                    <p className="text-white font-medium">{caseData?.summary?.graph?.customer?.id || 'Extracting...'}</p>
                </div>
                
                <div className="p-4 rounded-xl bg-aegis-surfaceSecondary border border-aegis-border">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <AlertTriangle className="w-4 h-4" /> Priority
                    </div>
                    <p className={`${isHighRisk ? 'text-aegis-danger' : 'text-aegis-primary'} font-medium`}>{caseData ? (isHighRisk ? 'Critical' : 'Normal') : 'Assessing...'}</p>
                </div>

                <div className="p-4 rounded-xl bg-aegis-surfaceSecondary border border-aegis-border">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <CheckCircle2 className="w-4 h-4" /> Status
                    </div>
                    <p className="text-aegis-primary font-medium">{caseData ? 'Completed' : 'In Progress'}</p>
                </div>

                <div className="p-4 rounded-xl bg-aegis-surfaceSecondary border border-aegis-border">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <Clock className="w-4 h-4" /> Case ID
                    </div>
                    <p className="text-white font-medium">{currentCaseId || 'Generating...'}</p>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-aegis-border">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Current Analyst</span>
                    <span className="text-gray-200 font-medium">Aegis AI Agent</span>
                </div>
            </div>
        </div>
    );
}
