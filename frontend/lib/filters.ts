import { create } from "zustand"

export interface CrossFilters {
  highway: string | null
  dayOfWeek: string | null
  hourRange: [number, number] | null
  severity: string | null
  roadName: string | null
  priority: string | null
  policeStation: string | null
  vehicleType: string | null
}

interface FilterActions {
  setHighway: (v: string | null) => void
  setDayOfWeek: (v: string | null) => void
  setHourRange: (v: [number, number] | null) => void
  setSeverity: (v: string | null) => void
  setRoadName: (v: string | null) => void
  setPriority: (v: string | null) => void
  setPoliceStation: (v: string | null) => void
  setVehicleType: (v: string | null) => void
  clearFilters: () => void
  activeCount: () => number
}

const initialFilters: CrossFilters = {
  highway: null,
  dayOfWeek: null,
  hourRange: null,
  severity: null,
  roadName: null,
  priority: null,
  policeStation: null,
  vehicleType: null,
}

export const useCrossFilters = create<CrossFilters & FilterActions>((set, get) => ({
  ...initialFilters,
  setHighway: (v) => set({ highway: v }),
  setDayOfWeek: (v) => set({ dayOfWeek: v }),
  setHourRange: (v) => set({ hourRange: v }),
  setSeverity: (v) => set({ severity: v }),
  setRoadName: (v) => set({ roadName: v }),
  setPriority: (v) => set({ priority: v }),
  setPoliceStation: (v) => set({ policeStation: v }),
  setVehicleType: (v) => set({ vehicleType: v }),
  clearFilters: () => set({ ...initialFilters }),
  activeCount: () => {
    const s = get()
    let n = 0
    if (s.highway) n++
    if (s.dayOfWeek) n++
    if (s.hourRange) n++
    if (s.severity) n++
    if (s.roadName) n++
    if (s.priority) n++
    if (s.policeStation) n++
    if (s.vehicleType) n++
    return n
  },
}))
