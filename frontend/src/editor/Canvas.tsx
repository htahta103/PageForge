import { useDroppable } from '@dnd-kit/core'

import { useT } from '@/i18n/context'
import { getRootIds } from '@/lib/tree'
import { useEditorStore } from '@/store/editorStore'

import { CanvasNode } from './CanvasNode'

export function Canvas() {
  const t = useT()
  const roots = useEditorStore((s) => getRootIds(s.components))
  const select = useEditorStore((s) => s.select)

  const { setNodeRef, isOver } = useDroppable({ id: 'drop-root' })

  return (
    <div
      ref={setNodeRef}
      className={[
        'min-h-[480px] rounded-xl border-2 border-dashed border-neutral-300 bg-white p-4',
        isOver ? 'border-blue-400 bg-blue-50/40' : '',
      ].join(' ')}
      data-testid="editor-canvas"
      onClick={() => select([])}
      onKeyDown={(e) => {
        if (e.key === 'Escape') select([])
      }}
      role="presentation"
    >
      {roots.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('editor.canvas.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {roots.map((id) => (
            <CanvasNode key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}
