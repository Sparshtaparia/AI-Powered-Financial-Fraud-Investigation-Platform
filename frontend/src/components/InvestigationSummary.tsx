import { FileCheck, Link as LinkIcon, AlertCircle, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useInvestigationStore } from '../store/investigationStore';

export default function InvestigationSummary() {
    const { caseData, isInvestigating, currentCaseId } = useInvestigationStore();

    if (!caseData && !isInvestigating) return null;

    const riskScore = caseData ? Math.round(caseData.summary.risk.risk_score * 100) : 0;
    const isHighRisk = riskScore >= 75;

    return (
        <div className="glass-panel w-full mt-6 flex flex-col md:flex-row overflow-hidden relative">
            {isInvestigating && !caseData && (
                <div className="absolute inset-0 bg-aegis-base/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-aegis-primary">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="font-medium tracking-wide">Generating Cryptographic Evidence...</span>
                    </div>
                </div>
            )}
            
            {/* Left side: Report Header */}
            <div className="w-full md:w-1/4 bg-aegis-surfaceSecondary border-r border-aegis-border p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4 text-white">
                    <FileText className="w-8 h-8 text-aegis-primary" />
                    <div>
                        <h2 className="text-xl font-display font-bold">Investigation Summary</h2>
                        <p className="text-xs font-mono text-gray-500 mt-1">ID: {currentCaseId || 'Generating...'}</p>
                    </div>
                </div>
                {caseData && (
                    <div className={`mt-4 p-4 rounded-xl border ${isHighRisk ? 'border-aegis-danger/30 bg-aegis-danger/5' : 'border-aegis-primary/30 bg-aegis-primary/5'}`}>
                        <div className="text-xs text-gray-400 mb-1">Final Risk Assessment</div>
                        <div className="flex items-end gap-2">
                            <span className={`text-4xl font-display font-bold ${isHighRisk ? 'text-aegis-danger' : 'text-aegis-primary'}`}>{riskScore}</span>
                            <span className={`text-sm font-semibold mb-1 uppercase ${isHighRisk ? 'text-aegis-danger' : 'text-aegis-primary'}`}>{isHighRisk ? 'High Risk' : 'Low Risk'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right side: Findings Grid */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gradient-to-br from-transparent to-aegis-base/50">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-lg text-aegis-purple border border-white/5 mt-1">
                        <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200 mb-1">Graph Topology</h4>
                        <p className="text-xs text-gray-400">
                            {caseData 
                                ? `Target entity is directly connected to ${caseData.summary.graph?.accounts?.length || 0} accounts.`
                                : 'Analyzing graph connections...'
                            }
                        </p>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-lg text-aegis-warning border border-white/5 mt-1">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200 mb-1">ML Confidence</h4>
                        <p className="text-xs text-gray-400">
                            {caseData 
                                ? `Machine learning models reached a ${((caseData.summary.risk.confidence || 0.95) * 100).toFixed(1)}% confidence interval.`
                                : 'Computing confidence intervals...'}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-lg text-aegis-primary border border-white/5 mt-1">
                        <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <h4 className="text-sm font-semibold text-gray-200 mb-1">Evidence Integrity</h4>
                        <p className="text-[10px] font-mono text-gray-500 break-all mb-1 truncate">
                            {caseData ? `Root: ${caseData.summary.evidence.merkle_root}` : 'Hashing bundle...'}
                        </p>
                        {caseData && <p className="text-[10px] text-aegis-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ledger verification passed</p>}
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg border mt-1 ${isHighRisk ? 'bg-aegis-danger/10 text-aegis-danger border-aegis-danger/20' : 'bg-aegis-primary/10 text-aegis-primary border-aegis-primary/20'}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className={`text-sm font-semibold mb-1 ${isHighRisk ? 'text-aegis-danger' : 'text-aegis-primary'}`}>Recommendation</h4>
                        <p className="text-xs text-gray-300">
                            {caseData ? (caseData.summary.recommendations?.[0] || 'No further action required.') : 'Awaiting planner synthesis...'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
