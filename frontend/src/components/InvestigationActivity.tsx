import { CheckCircle2, Circle, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { useInvestigationStore } from '../store/investigationStore';
import { useEffect, useState } from 'react';

export default function InvestigationActivity() {
    const { isInvestigating, caseData, currentCaseId } = useInvestigationStore();
    const [currentStep, setCurrentStep] = useState(0);

    // Simulate progress when investigating
    useEffect(() => {
        if (isInvestigating) {
            setCurrentStep(1);
            const interval = setInterval(() => {
                setCurrentStep(prev => (prev < 6 ? prev + 1 : prev));
            }, 1200);
            return () => clearInterval(interval);
        } else if (caseData) {
            setCurrentStep(7); // All complete
        } else {
            setCurrentStep(0);
        }
    }, [isInvestigating, caseData]);

    const getStatus = (stepIndex: number) => {
        if (!isInvestigating && !caseData) return 'pending';
        if (currentStep > stepIndex) return 'completed';
        if (currentStep === stepIndex) return 'in-progress';
        return 'pending';
    };

    const stages = [
        { id: 'intent', label: 'Intent Parsing', desc: 'Extracting entities and intent', status: getStatus(1) },
        { id: 'plan', label: 'Investigation Planning', desc: 'Planning required steps', status: getStatus(2) },
        { id: 'retrieval', label: 'Data Retrieval', desc: 'Fetching relevant data', status: getStatus(3) },
        { id: 'ml', label: 'ML Risk Analysis', desc: 'Calculating risk score', status: getStatus(4) },
        { id: 'graph', label: 'Graph Analysis', desc: 'Analyzing entity connections', status: getStatus(5) },
        { id: 'evidence', label: 'Evidence Verification', desc: 'Validating evidence integrity', status: getStatus(6) },
        { id: 'report', label: 'Report Generation', desc: 'Generating final report', status: getStatus(7) },
    ];

    const currentStageInfo = stages.find(s => s.status === 'in-progress') || stages[6];

    return (
        <div className="w-full h-full flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.2)] bg-aegis-surface">
            <div className="p-6 border-b border-aegis-border flex items-center justify-between shrink-0">
                <div>
                    <h3 className="text-lg font-display font-semibold text-white">Investigation Activity</h3>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{currentCaseId || 'Awaiting Investigation...'}</p>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                {/* Current Stage Highlight */}
                {isInvestigating && (
                    <div className="mb-8">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Stage</h4>
                        <div className="bg-aegis-surfaceSecondary border border-aegis-primary/30 rounded-xl p-4 relative overflow-hidden group cursor-pointer hover:border-aegis-primary/60 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-aegis-primary"></div>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-aegis-primary">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="font-medium text-sm">{currentStageInfo.label}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-xs text-gray-400 pl-6">{currentStageInfo.desc}</p>
                            <div className="mt-4 pl-6 flex items-center gap-3">
                                <div className="h-1 flex-1 bg-aegis-base rounded-full overflow-hidden">
                                    <div className="h-full bg-aegis-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentStep / 7) * 100}%` }}></div>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500">{Math.round((currentStep / 7) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Execution Timeline */}
                <div className={!isInvestigating && !caseData ? 'opacity-50' : ''}>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Execution Timeline</h4>
                    <div className="relative pl-3">
                        {/* Connecting Line */}
                        <div className="absolute top-2 bottom-6 left-[15px] w-px bg-aegis-border"></div>
                        
                        <div className="flex flex-col gap-6">
                            {stages.map((stage) => (
                                <div key={stage.id} className="relative flex items-start gap-4">
                                    <div className="relative z-10 bg-aegis-surface rounded-full">
                                        {stage.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-aegis-primary" />}
                                        {stage.status === 'in-progress' && (
                                            <div className="w-5 h-5 relative flex items-center justify-center">
                                                <span className="absolute inline-flex h-full w-full rounded-full bg-aegis-primary opacity-20 animate-ping"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-aegis-primary"></span>
                                            </div>
                                        )}
                                        {stage.status === 'pending' && <Circle className="w-5 h-5 text-gray-600" />}
                                    </div>
                                    
                                    <div className="flex-1 pb-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-medium ${stage.status === 'completed' ? 'text-gray-200' : stage.status === 'in-progress' ? 'text-white' : 'text-gray-500'}`}>
                                                {stage.label}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{stage.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* AI Insight Box */}
            {caseData && (
                <div className="p-5 border-t border-aegis-border bg-gradient-to-br from-aegis-surfaceSecondary to-aegis-base shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-aegis-purple" />
                        <h4 className="text-sm font-medium text-white">AI Insight</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        {caseData.summary.recommendations?.[0] || 'Investigation completed successfully. Review findings for final decision.'}
                    </p>
                    <button className="mt-3 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors flex justify-center items-center gap-2">
                        View Full Insight <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
