import { create } from 'zustand'

interface InvestigationState {
    currentCaseId: string | null;
    caseData: any | null;
    setCurrentCase: (id: string, data: any) => void;
}

export const useInvestigationStore = create<InvestigationState>((set) => ({
    currentCaseId: null,
    caseData: null,
    setCurrentCase: (id, data) => set({ currentCaseId: id, caseData: data })
}))
