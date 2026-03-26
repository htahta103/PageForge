import { create } from 'zustand'
import { temporal } from 'zundo'
import type {
  BreakpointId,
  BreakpointPropOverrides,
  ComponentId,
  ComponentMeta,
  ComponentNode,
} from '../types/components'
import { getDefinition } from '../registry/registry'

const ROOT_ID: ComponentId = 'root'

function findParentId(
  components: Record<ComponentId, ComponentNode>,
  childId: ComponentId,
): ComponentId | null {
  for (const [pid, node] of Object.entries(components)) {
    if (node.children.includes(childId)) return pid
  }
  return null
}

/** True if candidateId is draggedId or nested under draggedId (invalid reparent target). */
function isUnderDragged(
  components: Record<ComponentId, ComponentNode>,
  draggedId: ComponentId,
  candidateId: ComponentId,
): boolean {
  if (candidateId === draggedId) return true
  let cur: ComponentId | null = findParentId(components, candidateId)
  while (cur) {
    if (cur === draggedId) return true
    cur = findParentId(components, cur)
  }
  return false
}

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
  setMeta: (id: ComponentId, patch: Partial<ComponentMeta>) => void
  /** Move a node to destParentId at index (0-based, relative to children before the move). */
  moveNode: (draggedId: ComponentId, destParentId: ComponentId, destIndex: number) => void
}

/** visible/locked default true / false when omitted */
export function isNodeVisible(node: ComponentNode | undefined): boolean {
  if (!node) return false
  return node.meta?.visible !== false
}

export function isNodeLocked(node: ComponentNode | undefined): boolean {
  return node?.meta?.locked === true
}

export function layerDisplayName(node: ComponentNode): string {
  const n = node.meta?.name?.trim()
  if (n) return n
  return node.type
}

const rootNode: ComponentNode = {
  id: ROOT_ID,
  type: 'Root',
  props: {},
  children: [],
  meta: { name: 'Root' },
}

const initialState: AppState = {
  components: { [ROOT_ID]: rootNode },
  selectedIds: [],
  activeBreakpoint: 'desktop',
  clipboard: null,
}

const useAppStoreBase = create<AppState & AppActions>()(
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
        const title = getDefinition(type)?.title ?? type
        set((state) => {
          const parent = state.components[parentId]
          if (!parent) return state
          return {
            components: {
              ...state.components,
              [id]: { id, type, props, children: [], meta: { name: title } },
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
          if (isNodeLocked(node)) return state
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
          if (isNodeLocked(node)) return state
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
      setMeta: (id, patch) => {
        set((state) => {
          const node = state.components[id]
          if (!node) return state
          if (isNodeLocked(node) && patch.name !== undefined) return state
          const nextMeta: ComponentMeta = { ...node.meta, ...patch }
          const nextComponents = {
            ...state.components,
            [id]: { ...node, meta: nextMeta },
          }
          let nextSelected = state.selectedIds
          if (patch.visible === false && state.selectedIds.includes(id)) {
            nextSelected = state.selectedIds.filter((s) => s !== id)
          }
          return { components: nextComponents, selectedIds: nextSelected }
        })
      },
      moveNode: (draggedId, destParentId, destIndex) => {
        set((state) => {
          const { components } = state
          if (draggedId === ROOT_ID) return state
          const dragged = components[draggedId]
          const destParent = components[destParentId]
          if (!dragged || !destParent) return state
          if (isNodeLocked(dragged)) return state
          if (isUnderDragged(components, draggedId, destParentId)) return state

          const oldParentId = findParentId(components, draggedId)
          if (!oldParentId) return state
          const oldParent = components[oldParentId]
          if (!oldParent) return state
          const oldIdx = oldParent.children.indexOf(draggedId)
          if (oldIdx < 0) return state

          const next: Record<ComponentId, ComponentNode> = { ...components }

          const oldChildren = [...oldParent.children]
          oldChildren.splice(oldIdx, 1)
          next[oldParentId] = { ...oldParent, children: oldChildren }

          const updatedDest = next[destParentId]
          if (!updatedDest) return state
          const destChildren = [...updatedDest.children]

          let insertAt = destIndex
          if (oldParentId === destParentId) {
            if (destIndex > oldIdx) insertAt = destIndex - 1
          }
          insertAt = Math.max(0, Math.min(insertAt, destChildren.length))
          destChildren.splice(insertAt, 0, draggedId)
          next[destParentId] = { ...updatedDest, children: destChildren }

          return { components: next }
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

/** Replace tree from API/load; clears undo/redo and selection. */
export const useAppStore = useAppStoreBase

export function loadCanvasState(components: Record<ComponentId, ComponentNode>) {
  useAppStore.setState({
    components,
    selectedIds: [],
    activeBreakpoint: 'desktop',
  })
  useAppStore.temporal.getState().clear()
}

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
