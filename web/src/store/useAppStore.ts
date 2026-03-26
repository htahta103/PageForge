import { create } from 'zustand'
import { temporal } from 'zundo'
import type {
  BreakpointId,
  BreakpointPropOverrides,
  ComponentId,
  ComponentNode,
} from '../types/components'

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
  addComponent: (type: string, parentId?: ComponentId, initialProps?: Record<string, unknown>) => ComponentId
  deleteComponents: (ids: ComponentId[]) => void
  setProp: (id: ComponentId, key: string, value: unknown) => void
  clearPropOverride: (id: ComponentId, key: string) => void
}

const rootNode: ComponentNode = { id: ROOT_ID, type: 'Root', props: {}, children: [] }

const initialState: AppState = {
  components: { [ROOT_ID]: rootNode },
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
          components: { [ROOT_ID]: rootNode },
          selectedIds: [],
        })
      },
      select: (ids) => set({ selectedIds: ids }),
      selectOne: (id) => set({ selectedIds: id ? [id] : [] }),
      setActiveBreakpoint: (bp) => set({ activeBreakpoint: bp }),
      addComponent: (type, parentId = ROOT_ID, initialProps) => {
        const id = globalThis.crypto?.randomUUID?.() ?? `cmp_${Date.now()}_${Math.random()}`
        const props = { ...(initialProps ?? {}) }
        set((state) => {
          const parent = state.components[parentId]
          if (!parent) return state
          return {
            components: {
              ...state.components,
              [id]: { id, type, props, children: [] },
              [parentId]: { ...parent, children: [...parent.children, id] },
            },
            selectedIds: [id],
          }
        })
        return id
      },
      deleteComponents: (ids) => {
        set((state) => {
          const toRemove = new Set<ComponentId>()
          const collect = (cid: ComponentId) => {
            if (cid === ROOT_ID || toRemove.has(cid)) return
            toRemove.add(cid)
            const n = state.components[cid]
            for (const ch of n?.children ?? []) collect(ch)
          }
          for (const cid of ids) collect(cid)
          if (toRemove.size === 0) return state

          const nextComponents = { ...state.components }
          for (const cid of toRemove) delete nextComponents[cid]

          for (const pid of Object.keys(nextComponents)) {
            const p = nextComponents[pid]
            if (!p) continue
            const children = p.children.filter((c) => !toRemove.has(c))
            if (children.length !== p.children.length) {
              nextComponents[pid] = { ...p, children }
            }
          }

          return {
            components: nextComponents,
            selectedIds: state.selectedIds.filter((i) => !toRemove.has(i)),
          }
        })
      },
      setProp: (id, key, value) => {
        set((state) => {
          const node = state.components[id]
          if (!node) return state
          const bp = state.activeBreakpoint
          if (bp === 'desktop') {
            return {
              components: {
                ...state.components,
                [id]: { ...node, props: { ...node.props, [key]: value } },
              },
            }
          }
          const prevAll = node.breakpointOverrides ?? {}
          const prevBp = prevAll[bp] ?? {}
          return {
            components: {
              ...state.components,
              [id]: {
                ...node,
                breakpointOverrides: {
                  ...prevAll,
                  [bp]: { ...prevBp, [key]: value },
                },
              },
            },
          }
        })
      },
      clearPropOverride: (id, key) => {
        set((state) => {
          const node = state.components[id]
          if (!node) return state
          const bp = state.activeBreakpoint
          if (bp === 'desktop') return state
          const ov = node.breakpointOverrides?.[bp]
          if (!ov || !(key in ov)) return state
          const nextBp = { ...ov }
          delete nextBp[key]
          const nextAll = { ...node.breakpointOverrides }
          if (Object.keys(nextBp).length === 0) {
            delete nextAll[bp]
          } else {
            nextAll[bp] = nextBp
          }
          const finalOv: BreakpointPropOverrides | undefined =
            Object.keys(nextAll).length === 0 ? undefined : (nextAll as BreakpointPropOverrides)
          return {
            components: {
              ...state.components,
              [id]: { ...node, breakpointOverrides: finalOv },
            },
          }
        })
      },
    }),
    {
      limit: 100,
      partialize: (state) => ({ components: state.components }),
      equality: (past, current) => past.components === current.components,
    },
  ),
)

function sanitizeSelection() {
  const s = useAppStore.getState()
  const next = s.selectedIds.filter((id) => id === ROOT_ID || s.components[id])
  if (next.length === s.selectedIds.length) return
  useAppStore.setState({ selectedIds: next })
}

/** Undo last canvas tree change only (selection & breakpoint do not consume history). */
export function canvasUndo() {
  const t = useAppStore.temporal.getState()
  if (t.pastStates.length === 0) return
  t.undo()
  sanitizeSelection()
}

/** Redo last reverted canvas tree change. */
export function canvasRedo() {
  const t = useAppStore.temporal.getState()
  if (t.futureStates.length === 0) return
  t.redo()
  sanitizeSelection()
}

