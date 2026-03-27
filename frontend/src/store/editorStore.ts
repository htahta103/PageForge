import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import { temporal } from 'zundo'

import { getPage, updatePage } from '@/lib/api/pages'
import type { Breakpoint } from '@/lib/styles'
import {
  collectSubtreeIds,
  componentsArrayToRecord,
  componentsRecordToArray,
  getRootIds,
  getSortedChildrenIds,
  nextOrderForNewChild,
} from '@/lib/tree'
import { getRegistration } from '@/registry'
import type { Component, ComponentType } from '@/types/api'

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
  reorderWithinParent: (
    parentId: string | null,
    activeId: string,
    overId: string,
  ) => void
  nudgeSelectedPosition: (dx: number, dy: number, gridSize?: number) => void
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

function parsePx(raw: string | undefined): number {
  if (!raw) return 0
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : 0
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
        const target = get().selectedIds[0]
        if (!target) return
        const subtree = collectSubtreeIds(get().components, target)
        set((s) => {
          const next: Record<string, Component> = { ...s.components }
          for (const rid of subtree) {
            delete next[rid]
          }
          for (const comp of Object.values(next)) {
            next[comp.id] = {
              ...comp,
              children: comp.children.filter((ch) => !subtree.has(ch)),
            }
          }
          return { components: next, selectedIds: [] }
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

      nudgeSelectedPosition: (dx, dy, gridSize = 8) => {
        if (dx === 0 && dy === 0) return
        set((s) => {
          const next = { ...s.components }
          for (const id of s.selectedIds) {
            const node = next[id]
            if (!node || node.meta.locked) continue
            const base = node.styles.base ?? {}
            const left = parsePx(base.marginLeft)
            const top = parsePx(base.marginTop)
            const targetLeft = left + dx
            const targetTop = top + dy
            const snappedLeft = Math.round(targetLeft / gridSize) * gridSize
            const snappedTop = Math.round(targetTop / gridSize) * gridSize
            next[id] = {
              ...node,
              styles: {
                ...node.styles,
                base: {
                  ...base,
                  marginLeft: `${snappedLeft}px`,
                  marginTop: `${snappedTop}px`,
                },
              },
            }
          }
          return { components: next }
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
