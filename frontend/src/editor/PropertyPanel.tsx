import type { ReactNode } from 'react'

import { useT } from '@/i18n/context'
import { useEditorStore } from '@/store/editorStore'

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-neutral-600">{label}</div>
      {children}
    </label>
  )
}

export function PropertyPanel() {
  const t = useT()
  const selectedId = useEditorStore((s) => s.selectedIds[0])
  const comp = useEditorStore((s) =>
    selectedId ? s.components[selectedId] : undefined,
  )
  const updateSelected = useEditorStore((s) => s.updateSelected)

  if (!comp) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t('editor.properties.title')}
        </div>
        <p className="text-sm text-neutral-600">{t('editor.properties.none')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {t('editor.properties.title')}
      </div>

      <Field label={t('prop.meta.name')}>
        <input
          className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
          value={comp.meta.name}
          onChange={(e) =>
            updateSelected({ meta: { name: e.target.value } })
          }
        />
      </Field>

      {comp.type === 'text' && (
        <Field label={t('prop.text.body')}>
          <textarea
            className="min-h-[96px] w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={String(comp.props.text ?? '')}
            onChange={(e) => updateSelected({ props: { text: e.target.value } })}
          />
        </Field>
      )}

      {comp.type === 'button' && (
        <Field label={t('prop.button.label')}>
          <input
            className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={String(comp.props.label ?? '')}
            onChange={(e) =>
              updateSelected({ props: { label: e.target.value } })
            }
          />
        </Field>
      )}

      {comp.type === 'image' && (
        <>
          <Field label={t('prop.image.src')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.src ?? '')}
              onChange={(e) =>
                updateSelected({ props: { src: e.target.value } })
              }
            />
          </Field>
          <Field label={t('prop.image.alt')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.alt ?? '')}
              onChange={(e) =>
                updateSelected({ props: { alt: e.target.value } })
              }
            />
          </Field>
        </>
      )}

      {comp.type === 'container' && (
        <Field label={t('prop.styles.minHeight')}>
          <input
            type="number"
            className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={parseInt(comp.styles.base.minHeight ?? '80', 10) || 80}
            onChange={(e) =>
              updateSelected({
                stylesPatch: { base: { minHeight: `${e.target.value}px` } },
              })
            }
          />
        </Field>
      )}
    </div>
  )
}
