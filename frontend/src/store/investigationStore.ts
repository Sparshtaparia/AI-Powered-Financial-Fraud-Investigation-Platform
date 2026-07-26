import { create } from 'zustand'

export interface InvestigationResult {
    case_id: string;
    status: string;
    summary: {
        risk: { risk_score: number; label: string; confidence?: number; };
        graph: any;
        evidence: { merkle_root: string; };
        recommendations: string[];
        audit?: any[];
    };
}

interface InvestigationState {
    currentCaseId: string;
    caseData: InvestigationResult | null;
    isInvestigating: boolean;
    setCurrentCase: (id: string, data: InvestigationResult | null) => void;
    setIsInvestigating: (status: boolean) => void;
}

export const useInvestigationStore = create<InvestigationState>((set) => ({
    currentCaseId: '',
    caseData: null,
    isInvestigating: false,
    setCurrentCase: (id, data) => set({ currentCaseId: id, caseData: data }),
    setIsInvestigating: (status) => set({ isInvestigating: status })
}))
