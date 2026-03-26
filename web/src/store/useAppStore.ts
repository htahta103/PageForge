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
import { collectDescendantIds, findParentId, ROOT_ID } from '../lib/tree'
import { DEFAULT_LAYOUT, normalizeLayout, type LayoutState } from '../utils/componentLayout'

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
  toggleInSelection: (id: ComponentId) => void
  setActiveBreakpoint: (bp: BreakpointId) => void
  addComponent: (type: string, parentId?: ComponentId, initialProps?: Record<string, unknown>) => ComponentId
  deleteComponents: (ids: ComponentId[]) => void
  setProp: (id: ComponentId, key: string, value: unknown) => void
  clearPropOverride: (id: ComponentId, key: string) => void
  setMeta: (id: ComponentId, patch: Partial<ComponentMeta>) => void
  moveNode: (draggedId: ComponentId, destParentId: ComponentId, destIndex: number) => void
  deleteSelected: () => void
  groupSelected: () => void
  ungroupSelected: () => void
  nudgeSelectedLayout: (dxPx: number, dyPx: number) => void
}

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
      toggleInSelection: (id) => {
        if (id === ROOT_ID) return
        set((state) => {
          const cur = state.selectedIds
          if (cur.includes(id)) {
            const next = cur.filter((x) => x !== id)
            return { selectedIds: next.length ? next : [] }
          }
          return { selectedIds: [...cur, id] }
        })
      },
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
      deleteSelected: () => {
        set((state) => {
          const toRemove = new Set(
            state.selectedIds.filter(
              (id) =>
                id !== ROOT_ID &&
                state.components[id] &&
                !isNodeLocked(state.components[id]),
            ),
          )
          for (const id of [...toRemove]) {
            for (const d of collectDescendantIds(state.components, id)) {
              if (d !== ROOT_ID && !isNodeLocked(state.components[d])) toRemove.add(d)
            }
          }
          if (!toRemove.size) return { selectedIds: [] }
          const next: Record<ComponentId, ComponentNode> = {}
          for (const [id, node] of Object.entries(state.components)) {
            if (toRemove.has(id)) continue
            next[id] = {
              ...node,
              children: node.children.filter((c) => !toRemove.has(c)),
            }
          }
          return { components: next, selectedIds: [] }
        })
      },
      groupSelected: () => {
        set((state) => {
          const picked = state.selectedIds.filter((id) => id !== ROOT_ID && state.components[id])
          if (picked.length < 2) return state
          if (picked.some((id) => isNodeLocked(state.components[id]!))) return state

          const parentId = findParentId(state.components, picked[0]!)
          if (!parentId) return state
          const parent = state.components[parentId]
          if (!parent) return state

          const parentMismatch = picked.some((id) => findParentId(state.components, id) !== parentId)
          if (parentMismatch) return state

          const order = new Map(parent.children.map((id, i) => [id, i]))
          const sorted = [...picked].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
          const pickSet = new Set(sorted)
          const insertAt = Math.min(...sorted.map((id) => parent.children.indexOf(id)))

          const groupId = globalThis.crypto?.randomUUID?.() ?? `cmp_${Date.now()}_${Math.random()}`
          const groupTitle = getDefinition('Group')?.title ?? 'Group'
          const groupLayout: LayoutState = {
            ...DEFAULT_LAYOUT,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: { ...DEFAULT_LAYOUT.width },
            height: { ...DEFAULT_LAYOUT.height },
            padding: { ...DEFAULT_LAYOUT.padding },
            margin: { ...DEFAULT_LAYOUT.margin },
          }

          const newChildren = parent.children.filter((id) => !pickSet.has(id))
          newChildren.splice(insertAt, 0, groupId)

          return {
            components: {
              ...state.components,
              [groupId]: {
                id: groupId,
                type: 'Group',
                props: { layout: groupLayout },
                children: sorted,
                meta: { name: groupTitle },
              },
              [parentId]: { ...parent, children: newChildren },
            },
            selectedIds: [groupId],
          }
        })
      },
      ungroupSelected: () => {
        set((state) => {
          if (state.selectedIds.length !== 1) return state
          const gid = state.selectedIds[0]!
          const node = state.components[gid]
          if (!node || node.type !== 'Group') return state
          if (isNodeLocked(node)) return state

          const parentId = findParentId(state.components, gid)
          if (!parentId) return state
          const parent = state.components[parentId]
          if (!parent) return state

          const ix = parent.children.indexOf(gid)
          if (ix < 0) return state

          const nextChildren = [...parent.children]
          nextChildren.splice(ix, 1, ...node.children)

          const rest = { ...state.components }
          delete rest[gid]
          return {
            components: {
              ...rest,
              [parentId]: { ...parent, children: nextChildren },
            },
            selectedIds: node.children.length ? [...node.children] : [],
          }
        })
      },
      nudgeSelectedLayout: (dxPx, dyPx) => {
        set((state) => {
          const next: Record<ComponentId, ComponentNode> = { ...state.components }
          for (const id of state.selectedIds) {
            if (id === ROOT_ID) continue
            const node = next[id]
            if (!node || isNodeLocked(node)) continue
            const L = normalizeLayout(node.props.layout)
            const ml = Number.parseFloat(L.margin.left) || 0
            const mt = Number.parseFloat(L.margin.top) || 0
            const nextL: LayoutState = {
              ...L,
              margin: {
                ...L.margin,
                left: String(Math.round(ml + dxPx)),
                top: String(Math.round(mt + dyPx)),
              },
            }
            next[id] = { ...node, props: { ...node.props, layout: nextL } }
          }
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

export function canvasUndo() {
  const t = useAppStore.temporal.getState()
  if (t.pastStates.length === 0) return
  t.undo()
  sanitizeSelection()
}

export function canvasRedo() {
  const t = useAppStore.temporal.getState()
  if (t.futureStates.length === 0) return
  t.redo()
  sanitizeSelection()
}
