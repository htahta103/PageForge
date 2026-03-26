import { useEditorStore } from './store'
import type { LayoutMode } from './types'

function ModeButton({
  mode,
  label,
}: {
  mode: LayoutMode
  label: string
}) {
  const layoutMode = useEditorStore((s) => s.layoutMode)
  const setLayoutMode = useEditorStore((s) => s.setLayoutMode)
  const isActive = layoutMode === mode

  return (
    <button
      type="button"
      onClick={() => setLayoutMode(mode)}
      aria-pressed={isActive}
      className={[
        'px-3 py-1 rounded border text-sm transition',
        isActive ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function Toolbar() {
  return (
    <div className="flex items-center gap-2">
      <ModeButton mode="grid" label="Grid" />
      <ModeButton mode="freeform" label="Freeform" />
    </div>
  )
}

