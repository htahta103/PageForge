import { useDroppable } from '@dnd-kit/core'

import { useT } from '@/i18n/context'
import {
  ButtonView,
  ContainerView,
  ImageView,
  TextView,
} from '@/registry/renderers'
import { resolveComponentStyles } from '@/lib/styles'
import { getSortedChildrenIds } from '@/lib/tree'
import { useEditorStore } from '@/store/editorStore'

export function CanvasNode({ id }: { id: string }) {
  const t = useT()
  const comp = useEditorStore((s) => s.components[id])
  const childIds = useEditorStore((s) =>
    comp ? getSortedChildrenIds(s.components, id) : [],
  )
  const select = useEditorStore((s) => s.select)
  const selected = useEditorStore((s) => s.selectedIds.includes(id))
  const bp = useEditorStore((s) => s.activeBreakpoint)

  const isContainer = comp?.type === 'container'
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${id}`,
    disabled: !isContainer,
  })

  if (!comp) return null
  const style = resolveComponentStyles(comp, bp)
  if (!comp.meta.visible) return null

  const ring = selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
  const hover = isContainer && isOver ? 'bg-blue-50/50' : ''

  return (
    <div
      ref={isContainer ? setNodeRef : undefined}
      className={['rounded-md', ring, hover].join(' ')}
      onClick={(e) => {
        e.stopPropagation()
        select([id])
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          select([id])
        }
      }}
      role="button"
      tabIndex={0}
    >
      {comp.type === 'text' && <TextView c={comp} style={style} />}
      {comp.type === 'button' && <ButtonView c={comp} style={style} />}
      {comp.type === 'image' && <ImageView c={comp} style={style} />}
      {comp.type === 'container' && (
        <ContainerView c={comp} style={style}>
          <div className="flex flex-col gap-2">
            {childIds.map((child) => (
              <CanvasNode key={child} id={child} />
            ))}
          </div>
        </ContainerView>
      )}
      {comp.type !== 'text' &&
        comp.type !== 'button' &&
        comp.type !== 'image' &&
        comp.type !== 'container' && (
          <div className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-600">
            {t('editor.unsupportedType', { type: comp.type })}
          </div>
        )}
    </div>
  )
}
