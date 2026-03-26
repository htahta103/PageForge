import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { useT } from '@/i18n/context'
import { listPaletteRegistrations } from '@/registry'
import type { ComponentType } from '@/types/api'

function PaletteTile({
  type,
  label,
}: {
  type: ComponentType
  label: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette:${type}`,
      data: { source: 'palette' as const, type },
    })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      {...listeners}
      {...attributes}
      className={[
        'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-medium shadow-sm',
        'hover:border-neutral-300 hover:bg-neutral-50',
        isDragging ? 'opacity-70' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function ComponentPalette() {
  const t = useT()
  const regs = listPaletteRegistrations()

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {t('editor.palette.title')}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {regs.map((r) => (
          <PaletteTile key={r.type} type={r.type} label={t(r.labelKey)} />
        ))}
      </div>
    </div>
  )
}
