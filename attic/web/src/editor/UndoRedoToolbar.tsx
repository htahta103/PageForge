import { useStore } from 'zustand'
import { canvasRedo, canvasUndo, useAppStore } from '../store/useAppStore'

export function UndoRedoToolbar() {
  const canUndo = useStore(useAppStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useAppStore.temporal, (s) => s.futureStates.length > 0)

  return (
    <div
      className="inline-flex overflow-hidden rounded-md border border-[color:var(--color-border)]"
      role="group"
      aria-label="Undo and redo"
    >
      <button
        type="button"
        className="border-r border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canUndo}
        onClick={() => canvasUndo()}
        title="Undo (⌘Z)"
      >
        Undo
      </button>
      <button
        type="button"
        className="bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canRedo}
        onClick={() => canvasRedo()}
        title="Redo (⌘⇧Z)"
      >
        Redo
      </button>
    </div>
  )
}
