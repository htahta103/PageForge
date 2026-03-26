import type { AppState } from './useAppStore'

export type SnapshotBookmark = {
  id: string
  name: string
  /** Equals `temporal.pastStates.length` at capture time (timeline index of current state). */
  depth: number
}

const timelineLabels: string[] = []
const snapshots: SnapshotBookmark[] = []

/** Sync label list with zundo before a new edit (drops orphaned labels from a chopped redo branch). */
export function recordHistoryOperation(
  past: AppState,
  cur: AppState,
  pastStatesLengthBeforeAppend: number,
): void {
  timelineLabels.length = pastStatesLengthBeforeAppend
  timelineLabels.push(inferOperationLabel(past, cur))
}

export function clearHistorySession(): void {
  timelineLabels.length = 0
  snapshots.length = 0
}

export function getTimelineLabels(): readonly string[] {
  return timelineLabels
}

export function getSnapshots(): readonly SnapshotBookmark[] {
  return snapshots
}

export function createSnapshot(name: string, depth: number): SnapshotBookmark {
  const id = globalThis.crypto?.randomUUID?.() ?? `snap_${Date.now()}`
  const mark: SnapshotBookmark = { id, name: name.trim() || 'Snapshot', depth }
  snapshots.push(mark)
  return mark
}

export function inferOperationLabel(past: AppState, cur: AppState): string {
  const pc = past.components ?? {}
  const cc = cur.components ?? {}
  if (Object.keys(pc).length === 0 && cc.root) return 'Initialize canvas'

  const pids = new Set(Object.keys(pc))
  const cids = new Set(Object.keys(cc))

  for (const id of cids) {
    if (!pids.has(id) && id !== 'root') {
      const n = cc[id]
      return `Add ${n?.type ?? 'component'}`
    }
  }

  for (const id of pids) {
    if (!cids.has(id) && id !== 'root') return 'Delete component'
  }

  for (const id of cids) {
    const a = pc[id]
    const b = cc[id]
    if (!a || !b) continue
    if (a.children.join(',') !== b.children.join(',')) return 'Move / reorder'
    if (JSON.stringify(a.props) !== JSON.stringify(b.props)) {
      const keys = new Set([...Object.keys(a.props), ...Object.keys(b.props)])
      for (const k of keys) {
        if (JSON.stringify(a.props[k]) !== JSON.stringify(b.props[k])) {
          if (k === 'layout') return 'Layout'
          if (k === 'typography') return 'Typography'
          if (k === 'surface') return 'Appearance'
          return `Edit ${k}`
        }
      }
    }
    if (JSON.stringify(a.meta) !== JSON.stringify(b.meta)) return 'Layer meta'
    if (JSON.stringify(a.breakpointOverrides) !== JSON.stringify(b.breakpointOverrides)) {
      return 'Breakpoint override'
    }
  }

  if (past.activeBreakpoint !== cur.activeBreakpoint) {
    return `Breakpoint (${String(cur.activeBreakpoint)})`
  }
  if (JSON.stringify(past.selectedIds) !== JSON.stringify(cur.selectedIds)) {
    return 'Selection'
  }

  return 'Edit'
}
