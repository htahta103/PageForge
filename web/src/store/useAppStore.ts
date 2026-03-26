import { create } from 'zustand'
import { temporal } from 'zundo'
import type { BreakpointId, ComponentId, ComponentNode } from '../types/components'

export interface AppState {
  components: Record<ComponentId, ComponentNode>
  selectedIds: ComponentId[]
  activeBreakpoint: BreakpointId
  clipboard: { ids: ComponentId[] } | null
}

export interface AppActions {
  select: (ids: ComponentId[]) => void
  setActiveBreakpoint: (bp: BreakpointId) => void
}

const initialState: AppState = {
  components: {},
  selectedIds: [],
  activeBreakpoint: 'base',
  clipboard: null,
}

export const useAppStore = create<AppState & AppActions>()(
  temporal(
    (set) => ({
      ...initialState,
      select: (ids) => set({ selectedIds: ids }),
      setActiveBreakpoint: (bp) => set({ activeBreakpoint: bp }),
    }),
    {
      partialize: (state) => ({
        components: state.components,
        selectedIds: state.selectedIds,
        activeBreakpoint: state.activeBreakpoint,
        clipboard: state.clipboard,
      }),
    },
  ),
)

