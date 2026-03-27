import { useState } from 'react'
import { useStore } from 'zustand/react'
import { createSnapshot, getSnapshots, getTimelineLabels } from '../store/historySession'
import { useAppStore } from '../store/useAppStore'

function jumpToPastDepth(target: number) {
  const t = useAppStore.temporal.getState()
  const p = t.pastStates.length
  if (target === p) return
  t.pause()
  try {
    if (target < p) t.undo(p - target)
    else t.redo(target - p)
  } finally {
    t.resume()
  }
}

function snapshotsAtDepth(depth: number): { id: string; name: string }[] {
  return getSnapshots()
    .filter((s) => s.depth === depth)
    .map((s) => ({ id: s.id, name: s.name }))
}

export function HistoryPanel() {
  const pastLen = useStore(useAppStore.temporal, (s) => s.pastStates.length)
  const futureLen = useStore(useAppStore.temporal, (s) => s.futureStates.length)
  const [snapRevision, setSnapRevision] = useState(0)

  const labels = getTimelineLabels()
  const maxDepth = pastLen + futureLen

  const rows: { depth: number; title: string; snapNames: string[] }[] = [
    {
      depth: 0,
      title: 'Canvas start',
      snapNames: snapshotsAtDepth(0).map((s) => s.name),
    },
  ]
  for (let d = 1; d <= maxDepth; d++) {
    rows.push({
      depth: d,
      title: labels[d - 1] ?? `Step ${d}`,
      snapNames: snapshotsAtDepth(d).map((s) => s.name),
    })
  }

  const canUndo = pastLen > 0
  const canRedo = futureLen > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">History</div>
        <div className="text-[11px] text-[color:var(--color-muted)]">
          Session · ⌘Z / ⇧⌘Z
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40"
          disabled={!canUndo}
          type="button"
          onClick={() => jumpToPastDepth(pastLen - 1)}
        >
          Undo
        </button>
        <button
          className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40"
          disabled={!canRedo}
          type="button"
          onClick={() => jumpToPastDepth(pastLen + 1)}
        >
          Redo
        </button>
        <button
          className="rounded-md border border-amber-500/70 bg-amber-50 px-2 py-1 text-xs text-amber-950 hover:bg-amber-100/90"
          type="button"
          onClick={() => {
            const name = window.prompt('Snapshot name (bookmark this point in history):', 'Milestone')
            if (name === null) return
            createSnapshot(name, useAppStore.temporal.getState().pastStates.length)
            setSnapRevision((n) => n + 1)
          }}
        >
          Save snapshot
        </button>
      </div>

      <div className="max-h-[min(420px,50vh)] space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2">
        {rows.map((row) => {
          const active = row.depth === pastLen
          const hasSnap = row.snapNames.length > 0
          return (
            <button
              key={`${row.depth}-${snapRevision}`}
              className={[
                'flex w-full min-w-0 flex-col gap-0.5 rounded-md border px-2 py-1.5 text-left text-xs transition-colors',
                active
                  ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 font-medium'
                  : 'border-transparent hover:bg-black/5',
                hasSnap ? 'ring-1 ring-amber-400/55' : '',
              ].join(' ')}
              type="button"
              onClick={() => jumpToPastDepth(row.depth)}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[color:var(--color-muted)] tabular-nums">
                  {row.depth}
                </span>
                <span className="truncate">{row.title}</span>
              </div>
              {hasSnap ? (
                <div className="pl-7 text-[10px] font-medium text-amber-900/90">
                  {row.snapNames.map((n) => `📌 ${n}`).join(' · ')}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
