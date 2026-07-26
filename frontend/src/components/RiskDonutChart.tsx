import { useInvestigationStore } from '../store/investigationStore';

export default function RiskDonutChart() {
    const { caseData, isInvestigating } = useInvestigationStore();
    
    if (!caseData && !isInvestigating) return null;

    const riskScore = caseData ? Math.round(caseData.summary.risk.risk_score * 100) : 0;
    
    // Calculate stroke offset for the single score
    const circumference = 2 * Math.PI * 40; // 251.2
    const offset = circumference - (riskScore / 100) * circumference;

    let color = '#22C55E';
    if (riskScore >= 75) color = '#EF4444';
    else if (riskScore >= 60) color = '#F97316';
    else if (riskScore >= 40) color = '#FBBF24';

    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden h-full">
            <h3 className="text-sm font-medium text-gray-400 absolute top-6 left-6">Assessed Risk</h3>
            
            <div className="mt-8 relative w-32 h-32 lg:w-40 lg:h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#151A20" strokeWidth="12" />
                    <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke={color} 
                        strokeWidth="12" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={isInvestigating ? circumference : offset} 
                        className="transition-all duration-1000 ease-out" 
                    />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl lg:text-4xl font-display font-bold text-white">
                        {isInvestigating ? '--' : riskScore}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Score</span>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                    {isInvestigating ? 'Calculating risk vectors...' : 'Confidence interval high.'}
                </p>
            </div>
        </div>
    );
}
