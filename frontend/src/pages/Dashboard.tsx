import InvestigationCommandBar from '../components/InvestigationCommandBar';
import PremiumKpiCards from '../components/PremiumKpiCards';
import InvestigationOverview from '../components/InvestigationOverview';
import RiskDonutChart from '../components/RiskDonutChart';
import RecentInvestigationsTable from '../components/RecentInvestigationsTable';
import InvestigationActivity from '../components/InvestigationActivity';
import InvestigationSummary from '../components/InvestigationSummary';
import { useInvestigationStore } from '../store/investigationStore';

export default function Dashboard() {
    const { caseData, isInvestigating } = useInvestigationStore();

    return (
        <div className="flex h-full w-full bg-aegis-base">
            {/* Left/Main Column - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-6 h-full custom-scrollbar">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
                    <InvestigationCommandBar />
                    <PremiumKpiCards />
                    
                    {(caseData || isInvestigating) && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-64 h-auto">
                                <div className="lg:col-span-2 h-full">
                                    <InvestigationOverview />
                                </div>
                                <div className="col-span-1 h-full">
                                    <RiskDonutChart />
                                </div>
                            </div>
                            <InvestigationSummary />
                        </>
                    )}
                    <RecentInvestigationsTable />
                </div>
            </div>

            {/* Right Column: Execution Timeline - Fixed Height */}
            <div className="w-[400px] flex-shrink-0 hidden xl:block h-full border-l border-aegis-border bg-aegis-surface">
                <InvestigationActivity />
            </div>
        </div>
    );
}
