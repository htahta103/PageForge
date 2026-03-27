import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import { temporal } from 'zundo'

import { getPage, updatePage } from '@/lib/api/pages'
import type { Breakpoint } from '@/lib/styles'
import {
  cloneWithNewIds,
  extractSubtrees,
  topLevelSelection,
} from '@/lib/editorSubtree'
import {
  collectSubtreeIds,
  componentsArrayToRecord,
  componentsRecordToArray,
  findParentId,
  getRootIds,
  getSortedChildrenIds,
  nextOrderForNewChild,
} from '@/lib/tree'
import { getRegistration } from '@/registry'
import type { Component, ComponentType } from '@/types/api'

/** In-memory clipboard for canvas copy/paste (Cmd/Ctrl+C / +V). */
let editorInternalClipboard: {
  roots: string[]
  nodes: Record<string, Component>
} | null = null

interface EditorState {
  projectId: string | null
  pageId: string | null
  pageName: string
  pageSlug: string
  components: Record<string, Component>
  selectedIds: string[]
  activeBreakpoint: Breakpoint
  loadState: { status: 'idle' | 'loading' | 'error' }
  saveState: { status: 'idle' | 'saving' | 'saved' | 'error' }
}

interface EditorActions {
  reset: () => void
  load: (projectId: string, pageId: string) => Promise<void>
  save: () => Promise<void>
  select: (ids: string[]) => void
  setBreakpoint: (bp: Breakpoint) => void
  addComponent: (
    type: ComponentType,
    parentId: string | null,
    displayName: string,
  ) => void
  updateSelected: (patch: {
    props?: Record<string, unknown>
    meta?: Partial<Component['meta']>
    stylesPatch?: {
      base?: Record<string, string>
      tablet?: Record<string, string>
      mobile?: Record<string, string>
    }
  }) => void
  deleteSelected: () => void
  copySelectionToInternalClipboard: () => void
  pasteFromInternalClipboard: () => void
  duplicateSelection: () => void
  selectAllOnCanvas: () => void
  clearSelection: () => void
  nudgeSelected: (dx: number, dy: number) => void
  groupSelection: (containerDisplayName: string) => void
  reorderWithinParent: (
    parentId: string | null,
    activeId: string,
    overId: string,
  ) => void
}

const initialEditorState: EditorState = {
  projectId: null,
  pageId: null,
  pageName: '',
  pageSlug: '',
  components: {},
  selectedIds: [],
  activeBreakpoint: 'desktop',
  loadState: { status: 'idle' },
  saveState: { status: 'idle' },
}

export const useEditorStore = create<EditorState & EditorActions>()(
  temporal(
    (set, get) => ({
      ...initialEditorState,

      reset: () => set({ ...initialEditorState }),

      load: async (projectId, pageId) => {
        set({ loadState: { status: 'loading' } })
        try {
          const page = await getPage(projectId, pageId)
          set({
            projectId,
            pageId,
            pageName: page.name,
            pageSlug: page.slug,
            components: componentsArrayToRecord(page.components ?? []),
            selectedIds: [],
            loadState: { status: 'idle' },
          })
        } catch {
          set({ loadState: { status: 'error' } })
        }
      },

      save: async () => {
        const { projectId, pageId, components, pageName, pageSlug } = get()
        if (!projectId || !pageId) return
        set({ saveState: { status: 'saving' } })
        try {
          await updatePage(projectId, pageId, {
            name: pageName,
            slug: pageSlug,
            components: componentsRecordToArray(components),
          })
          set({ saveState: { status: 'saved' } })
          window.setTimeout(() => {
            if (get().saveState.status === 'saved') {
              set({ saveState: { status: 'idle' } })
            }
          }, 1200)
        } catch {
          set({ saveState: { status: 'error' } })
        }
      },

      select: (ids) => set({ selectedIds: ids }),

      setBreakpoint: (bp) => set({ activeBreakpoint: bp }),

      addComponent: (type, parentId, displayName) => {
        const reg = getRegistration(type)
        if (!reg) return
        const id = crypto.randomUUID()
        const prev = get().components
        const order = nextOrderForNewChild(prev, parentId)
        const node: Component = {
          id,
          type: reg.type,
          parentId: parentId ?? undefined,
          children: [],
          props: { ...reg.defaultProps },
          styles: {
            base: { ...reg.defaultStyles.base },
            tablet: reg.defaultStyles.tablet
              ? { ...reg.defaultStyles.tablet }
              : undefined,
            mobile: reg.defaultStyles.mobile
              ? { ...reg.defaultStyles.mobile }
              : undefined,
          },
          meta: { name: displayName, locked: false, visible: true },
          order,
        }
        set((s) => {
          const next = { ...s.components, [id]: node }
          if (parentId) {
            const p = next[parentId]
            if (p) {
              next[parentId] = { ...p, children: [...p.children, id] }
            }
          }
          return { components: next, selectedIds: [id] }
        })
      },

      updateSelected: (patch) => {
        const sel = get().selectedIds[0]
        if (!sel) return
        set((s) => {
          const c = s.components[sel]
          if (!c) return s
          const stylesPatch = patch.stylesPatch
          const next: Component = {
            ...c,
            props: patch.props ? { ...c.props, ...patch.props } : c.props,
            meta: patch.meta ? { ...c.meta, ...patch.meta } : c.meta,
            styles: stylesPatch
              ? {
                  base: { ...c.styles.base, ...(stylesPatch.base ?? {}) },
                  tablet:
                    stylesPatch.tablet !== undefined
                      ? { ...(c.styles.tablet ?? {}), ...stylesPatch.tablet }
                      : c.styles.tablet,
                  mobile:
                    stylesPatch.mobile !== undefined
                      ? { ...(c.styles.mobile ?? {}), ...stylesPatch.mobile }
                      : c.styles.mobile,
                }
              : c.styles,
          }
          return { components: { ...s.components, [sel]: next } }
        })
      },

      deleteSelected: () => {
        const tops = topLevelSelection(get().components, get().selectedIds)
        if (tops.length === 0) return
        const remove = new Set<string>()
        for (const t of tops) {
          for (const id of collectSubtreeIds(get().components, t)) remove.add(id)
        }
        set((s) => {
          const next: Record<string, Component> = { ...s.components }
          for (const rid of remove) {
            delete next[rid]
          }
          for (const comp of Object.values(next)) {
            next[comp.id] = {
              ...comp,
              children: comp.children.filter((ch) => !remove.has(ch)),
            }
          }
          return { components: next, selectedIds: [] }
        })
      },

      copySelectionToInternalClipboard: () => {
        const { components, selectedIds } = get()
        const tops = topLevelSelection(components, selectedIds)
        if (tops.length === 0) return
        editorInternalClipboard = {
          roots: tops,
          nodes: extractSubtrees(components, tops),
        }
      },

      pasteFromInternalClipboard: () => {
        if (!editorInternalClipboard) return
        const { roots: clipRoots, nodes } = editorInternalClipboard
        const { map: fresh, roots: pasteRoots } = cloneWithNewIds(nodes, clipRoots)
        set((s) => {
          const m: Record<string, Component> = { ...s.components, ...fresh }
          const anchor = s.selectedIds[0]
          const parentId = anchor ? findParentId(m, anchor) : null

          const ordStart = (() => {
            if (parentId) {
              const sibs = getSortedChildrenIds(m, parentId)
              const orders = sibs.map((id) => m[id]?.order ?? 0)
              return orders.length ? Math.max(...orders) + 1 : 0
            }
            const r = getRootIds(m)
            const orders = r.map((id) => m[id]?.order ?? 0)
            return orders.length ? Math.max(...orders) + 1 : 0
          })()

          let o = ordStart
          for (const r of pasteRoots) {
            const node = m[r]
            if (!node) continue
            m[r] = { ...node, parentId: parentId ?? undefined, order: o }
            o += 1
            if (parentId) {
              const par = m[parentId]
              if (par) {
                m[parentId] = { ...par, children: [...par.children, r] }
              }
            }
          }

          return { components: m, selectedIds: [...pasteRoots] }
        })
      },

      duplicateSelection: () => {
        const tops = topLevelSelection(get().components, get().selectedIds)
        if (tops.length === 0) return
        const sorted = [...tops].sort((a, b) => {
          const ca = get().components[a]
          const cb = get().components[b]
          return (ca?.order ?? 0) - (cb?.order ?? 0)
        })
        set((s) => {
          let m: Record<string, Component> = { ...s.components }
          const newSelected: string[] = []
          for (const tid of sorted) {
            const fragment = extractSubtrees(m, [tid])
            const { map: cloned, roots } = cloneWithNewIds(fragment, [tid])
            const r0 = roots[0]
            if (!r0) continue
            const p = findParentId(m, tid)
            m = { ...m, ...cloned }
            const ord = (() => {
              if (p) {
                const sibs = getSortedChildrenIds(m, p).filter((id) => id !== r0)
                const orders = sibs.map((id) => m[id]?.order ?? 0)
                return orders.length ? Math.max(...orders) + 1 : 0
              }
              const rootsNow = getRootIds(m).filter((id) => id !== r0)
              const orders = rootsNow.map((id) => m[id]?.order ?? 0)
              return orders.length ? Math.max(...orders) + 1 : 0
            })()
            m[r0] = { ...m[r0]!, parentId: p ?? undefined, order: ord }
            if (p) {
              const par = m[p]!
              m[p] = { ...par, children: [...par.children, r0] }
            }
            newSelected.push(r0)
          }
          return { components: m, selectedIds: newSelected }
        })
      },

      selectAllOnCanvas: () => {
        const ids = Object.keys(get().components)
        if (ids.length === 0) return
        set({ selectedIds: ids })
      },

      clearSelection: () => set({ selectedIds: [] }),

      nudgeSelected: (dx, dy) => {
        if (dx === 0 && dy === 0) return
        const tops = topLevelSelection(get().components, get().selectedIds)
        if (tops.length === 0) return
        const parsePx = (v: string | undefined): number => {
          if (!v) return 0
          const m = String(v).match(/^(-?[\d.]+)px$/)
          return m ? parseFloat(m[1]!) : 0
        }
        const fmtPx = (n: number) => `${Math.round(n)}px`
        set((s) => {
          const next: Record<string, Component> = { ...s.components }
          for (const id of tops) {
            const c = next[id]
            if (!c) continue
            const base = { ...c.styles.base }
            const ml = parsePx(base.marginLeft) + dx
            const mt = parsePx(base.marginTop) + dy
            base.marginLeft = fmtPx(ml)
            base.marginTop = fmtPx(mt)
            next[id] = {
              ...c,
              styles: {
                ...c.styles,
                base,
              },
            }
          }
          return { components: next }
        })
      },

      groupSelection: (containerDisplayName) => {
        const { components: map, selectedIds } = get()
        const tops = topLevelSelection(map, selectedIds)
        if (tops.length < 1) return
        const parentId = findParentId(map, tops[0]!)
        if (tops.some((t) => findParentId(map, t) !== parentId)) return

        const reg = getRegistration('container')
        if (!reg) return

        set((s) => {
          const m: Record<string, Component> = { ...s.components }
          const sorted = [...tops].sort(
            (a, b) => (m[a]?.order ?? 0) - (m[b]?.order ?? 0),
          )
          const topsSet = new Set(sorted)
          const cid = crypto.randomUUID()

          const indexOfFirst = (() => {
            if (parentId) {
              const sibs = getSortedChildrenIds(m, parentId)
              const idxs = sorted.map((t) => sibs.indexOf(t)).filter((i) => i >= 0)
              return idxs.length ? Math.min(...idxs) : 0
            }
            const sibs = getRootIds(m)
            const idxs = sorted.map((t) => sibs.indexOf(t)).filter((i) => i >= 0)
            return idxs.length ? Math.min(...idxs) : 0
          })()

          const newNode: Component = {
            id: cid,
            type: reg.type,
            parentId: parentId ?? undefined,
            children: [...sorted],
            props: { ...reg.defaultProps },
            styles: {
              base: { ...reg.defaultStyles.base },
              tablet: reg.defaultStyles.tablet
                ? { ...reg.defaultStyles.tablet }
                : undefined,
              mobile: reg.defaultStyles.mobile
                ? { ...reg.defaultStyles.mobile }
                : undefined,
            },
            meta: { name: containerDisplayName, locked: false, visible: true },
            order: 0,
          }
          m[cid] = newNode

          if (parentId) {
            const p = m[parentId]!
            const ordered = getSortedChildrenIds(m, parentId)
            const filtered = ordered.filter((id) => !topsSet.has(id))
            const newChildren = [
              ...filtered.slice(0, indexOfFirst),
              cid,
              ...filtered.slice(indexOfFirst),
            ]
            m[parentId] = { ...p, children: newChildren }
            for (let i = 0; i < newChildren.length; i++) {
              const id = newChildren[i]!
              const n = m[id]
              if (n) m[id] = { ...n, order: i }
            }
          } else {
            const ordered = getRootIds(m)
            const filtered = ordered.filter((id) => !topsSet.has(id))
            const newRoots = [
              ...filtered.slice(0, indexOfFirst),
              cid,
              ...filtered.slice(indexOfFirst),
            ]
            for (let i = 0; i < newRoots.length; i++) {
              const id = newRoots[i]!
              const n = m[id]
              if (n) m[id] = { ...n, parentId: undefined, order: i }
            }
          }

          for (let i = 0; i < sorted.length; i++) {
            const id = sorted[i]!
            const n = m[id]
            if (n) m[id] = { ...n, parentId: cid, order: i }
          }

          return { components: m, selectedIds: [cid] }
        })
      },

      reorderWithinParent: (parentId, activeId, overId) => {
        if (activeId === overId) return
        set((s) => {
          const map = { ...s.components }
          let orderedIds: string[]
          if (parentId) {
            const p = map[parentId]
            if (!p) return s
            orderedIds = getSortedChildrenIds(map, parentId)
          } else {
            orderedIds = getRootIds(map)
          }
          const oldIndex = orderedIds.indexOf(activeId)
          const newIndex = orderedIds.indexOf(overId)
          if (oldIndex < 0 || newIndex < 0) return s
          const moved = arrayMove(orderedIds, oldIndex, newIndex)
          for (let i = 0; i < moved.length; i++) {
            const id = moved[i]!
            const n = map[id]
            if (n) map[id] = { ...n, order: i }
          }
          if (parentId) {
            const p = map[parentId]
            if (p) {
              map[parentId] = { ...p, children: moved }
            }
          }
          return { components: map }
        })
      },
    }),
    {
      limit: 100,
      partialize: (s) => ({
        components: s.components,
        selectedIds: s.selectedIds,
        pageName: s.pageName,
        pageSlug: s.pageSlug,
        activeBreakpoint: s.activeBreakpoint,
      }),
    },
  ),
)

export function useTemporalEditor() {
  return useEditorStore.temporal
}
