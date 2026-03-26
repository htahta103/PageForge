import { useAppStore } from '../store/useAppStore'

export function EditorPage() {
  const selectedIds = useAppStore((s) => s.selectedIds)
  const select = useAppStore((s) => s.select)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Editor</h1>
      <p className="text-sm text-[color:var(--color-muted)]">
        Placeholder route. Real canvas + layer tree will land after backend-api.
      </p>

      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Selection</div>
          <button
            className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm hover:bg-black/5"
            onClick={() => select([])}
            type="button"
          >
            Clear
          </button>
        </div>
        <div className="mt-2 text-sm text-[color:var(--color-muted)]">
          {selectedIds.length ? selectedIds.join(', ') : '(none)'}
        </div>
      </div>
    </div>
  )
}

