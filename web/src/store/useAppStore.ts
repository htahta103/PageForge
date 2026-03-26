import { create } from 'zustand'
import { temporal } from 'zundo'
import type { BreakpointId, ComponentId, ComponentNode } from '../types/components'

const ROOT_ID: ComponentId = 'root'

export interface AppState {
  components: Record<ComponentId, ComponentNode>
  selectedIds: ComponentId[]
  activeBreakpoint: BreakpointId
  clipboard: { ids: ComponentId[] } | null
}

export interface AppActions {
  ensureInitialized: () => void
  select: (ids: ComponentId[]) => void
  selectOne: (id: ComponentId | null) => void
  setActiveBreakpoint: (bp: BreakpointId) => void
  addComponent: (type: string, parentId?: ComponentId) => ComponentId
  setProp: (id: ComponentId, key: string, value: unknown) => void
}

const initialState: AppState = {
  components: {},
  selectedIds: [],
  activeBreakpoint: 'desktop',
  clipboard: null,
}

export const useAppStore = create<AppState & AppActions>()(
  temporal(
    (set, get) => ({
      ...initialState,
      ensureInitialized: () => {
        const { components } = get()
        if (components[ROOT_ID]) return
        set({
          components: {
            [ROOT_ID]: { id: ROOT_ID, type: 'Root', props: {}, children: [] },
          },
          selectedIds: [],
        })
      },
      select: (ids) => set({ selectedIds: ids }),
      selectOne: (id) => set({ selectedIds: id ? [id] : [] }),
      setActiveBreakpoint: (bp) => set({ activeBreakpoint: bp }),
      addComponent: (type, parentId = ROOT_ID) => {
        const id = globalThis.crypto?.randomUUID?.() ?? `cmp_${Date.now()}_${Math.random()}`
        set((state) => {
          const parent = state.components[parentId]
          if (!parent) return state
          return {
            components: {
              ...state.components,
              [id]: { id, type, props: {}, children: [] },
              [parentId]: { ...parent, children: [...parent.children, id] },
            },
            selectedIds: [id],
          }
        })
        return id
      },
      setProp: (id, key, value) => {
        set((state) => {
          const node = state.components[id]
          if (!node) return state
          return {
            components: {
              ...state.components,
              [id]: { ...node, props: { ...node.props, [key]: value } },
            },
          }
        })
      },
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

