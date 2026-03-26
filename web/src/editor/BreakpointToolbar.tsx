import { BREAKPOINT_OPTIONS, BREAKPOINT_WIDTH_PX } from '../lib/breakpoints'
import { useAppStore } from '../store/useAppStore'

export function BreakpointToolbar() {
  const active = useAppStore((s) => s.activeBreakpoint)
  const setActive = useAppStore((s) => s.setActiveBreakpoint)

  return (
    <div
      aria-label="Canvas breakpoint"
      className="flex flex-wrap items-center gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-1"
      role="toolbar"
    >
      {BREAKPOINT_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          aria-pressed={active === id}
          className={[
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            active === id
              ? 'bg-[color:var(--color-primary)] text-white shadow-sm'
              : 'text-[color:var(--color-muted)] hover:bg-black/5 hover:text-[color:var(--color-foreground)]',
          ].join(' ')}
          type="button"
          onClick={() => setActive(id)}
        >
          <span>{label}</span>
          <span className="ml-1.5 font-mono text-xs opacity-80">{BREAKPOINT_WIDTH_PX[id]}</span>
        </button>
      ))}
    </div>
  )
}
