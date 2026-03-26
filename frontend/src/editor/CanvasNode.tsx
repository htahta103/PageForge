import { useDroppable } from '@dnd-kit/core'
import { useMemo } from 'react'

import { useT } from '@/i18n/context'
import {
  ButtonView,
  CardView,
  ContainerView,
  CustomHtmlView,
  DividerView,
  IconView,
  ImageView,
  InputView,
  ListView,
  NavView,
  SpacerView,
  TextView,
  VideoView,
} from '@/registry/renderers'
import { resolveComponentStyles } from '@/lib/styles'
import { getSortedChildrenIds } from '@/lib/tree'
import { useEditorStore } from '@/store/editorStore'

export function CanvasNode({ id }: { id: string }) {
  const t = useT()
  const components = useEditorStore((s) => s.components)
  const comp = components[id]
  const childIds = useMemo(
    () => (comp ? getSortedChildrenIds(components, id) : []),
    [components, id, comp],
  )
  const select = useEditorStore((s) => s.select)
  const selected = useEditorStore((s) => s.selectedIds.includes(id))
  const bp = useEditorStore((s) => s.activeBreakpoint)

  const canHaveChildren =
    comp?.type === 'container' ||
    comp?.type === 'card' ||
    comp?.type === 'nav' ||
    comp?.type === 'list'
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${id}`,
    disabled: !canHaveChildren,
  })

  if (!comp) return null
  const style = resolveComponentStyles(comp, bp)
  if (!comp.meta.visible) return null

  const ring = selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
  const hover = canHaveChildren && isOver ? 'bg-blue-50/50' : ''
  const children = (
    <div className="flex flex-col gap-2">
      {childIds.map((child) => (
        <CanvasNode key={child} id={child} />
      ))}
    </div>
  )

  return (
    <div
      ref={canHaveChildren ? setNodeRef : undefined}
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
      {comp.type === 'input' && <InputView c={comp} style={style} />}
      {comp.type === 'icon' && <IconView c={comp} style={style} />}
      {comp.type === 'divider' && <DividerView c={comp} style={style} />}
      {comp.type === 'spacer' && <SpacerView c={comp} style={style} />}
      {comp.type === 'video' && <VideoView c={comp} style={style} />}
      {comp.type === 'custom-html' && <CustomHtmlView c={comp} style={style} />}
      {comp.type === 'container' && (
        <ContainerView c={comp} style={style}>
          {children}
        </ContainerView>
      )}
      {comp.type === 'card' && (
        <CardView c={comp} style={style}>
          {children}
        </CardView>
      )}
      {comp.type === 'nav' && (
        <NavView c={comp} style={style}>
          {children}
        </NavView>
      )}
      {comp.type === 'list' && (
        <ListView c={comp} style={style}>
          {childIds.map((child) => (
            <li key={child} className="m-0">
              <CanvasNode id={child} />
            </li>
          ))}
        </ListView>
      )}
      {comp.type !== 'text' &&
        comp.type !== 'button' &&
        comp.type !== 'image' &&
        comp.type !== 'input' &&
        comp.type !== 'card' &&
        comp.type !== 'nav' &&
        comp.type !== 'list' &&
        comp.type !== 'icon' &&
        comp.type !== 'divider' &&
        comp.type !== 'spacer' &&
        comp.type !== 'video' &&
        comp.type !== 'custom-html' &&
        comp.type !== 'container' && (
          <div className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-600">
            {t('editor.unsupportedType', { type: comp.type })}
          </div>
        )}
    </div>
  )
}
