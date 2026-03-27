import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { useT } from '@/i18n/context'
import { useEditorStore } from '@/store/editorStore'

const ICON_OPTIONS = [
  '★',
  '☆',
  '✓',
  '✕',
  '❤',
  '⚡',
  '☀',
  '☁',
  '☕',
  '✉',
  '☎',
  '⌂',
  '⚙',
  '🔍',
  '🔔',
  '📁',
  '📦',
  '📅',
  '🛒',
  '🎯',
] as const

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
  const iconSearch = useMemo(() => {
    if (!comp || comp.type !== 'icon') return ''
    return String(comp.props.iconSearch ?? '')
  }, [comp])
  const filteredIcons = useMemo(() => {
    const query = iconSearch.trim()
    if (!query) return ICON_OPTIONS
    const matching = ICON_OPTIONS.filter((glyph) => glyph.includes(query))
    if (matching.length > 0) return matching
    const current = String(comp?.props.glyph ?? '')
    return current ? [current] : ICON_OPTIONS
  }, [comp, iconSearch])

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

      {comp.type === 'input' && (
        <>
          <Field label={t('prop.input.placeholder')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.placeholder ?? '')}
              onChange={(e) =>
                updateSelected({ props: { placeholder: e.target.value } })
              }
            />
          </Field>
          <Field label={t('prop.input.name')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.name ?? '')}
              onChange={(e) => updateSelected({ props: { name: e.target.value } })}
            />
          </Field>
          <Field label={t('prop.input.type')}>
            <select
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.inputType ?? 'text')}
              onChange={(e) =>
                updateSelected({ props: { inputType: e.target.value } })
              }
            >
              <option value="text">{t('prop.input.type.text')}</option>
              <option value="email">{t('prop.input.type.email')}</option>
              <option value="password">{t('prop.input.type.password')}</option>
              <option value="number">{t('prop.input.type.number')}</option>
              <option value="tel">{t('prop.input.type.tel')}</option>
              <option value="url">{t('prop.input.type.url')}</option>
            </select>
          </Field>
        </>
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

      {comp.type === 'card' && (
        <>
          <Field label={t('prop.card.title')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.title ?? '')}
              onChange={(e) => updateSelected({ props: { title: e.target.value } })}
            />
          </Field>
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
        </>
      )}

      {comp.type === 'nav' && (
        <Field label={t('prop.nav.brand')}>
          <input
            className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={String(comp.props.brand ?? '')}
            onChange={(e) => updateSelected({ props: { brand: e.target.value } })}
          />
        </Field>
      )}

      {comp.type === 'list' && (
        <Field label={t('prop.list.ordered')}>
          <select
            className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={String(Boolean(comp.props.ordered))}
            onChange={(e) =>
              updateSelected({ props: { ordered: e.target.value === 'true' } })
            }
          >
            <option value="false">{t('common.no')}</option>
            <option value="true">{t('common.yes')}</option>
          </select>
        </Field>
      )}

      {comp.type === 'icon' && (
        <>
          <Field label="Search icon">
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={iconSearch}
              onChange={(e) =>
                updateSelected({ props: { iconSearch: e.target.value } })
              }
              placeholder="Type a symbol, e.g. ★"
            />
          </Field>
          <Field label={t('prop.icon.glyph')}>
            <select
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.glyph ?? '')}
              onChange={(e) => updateSelected({ props: { glyph: e.target.value } })}
            >
              {filteredIcons.map((glyph) => (
                <option key={glyph} value={glyph}>
                  {glyph}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('prop.a11y.ariaLabel')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.ariaLabel ?? '')}
              onChange={(e) =>
                updateSelected({ props: { ariaLabel: e.target.value } })
              }
            />
          </Field>
        </>
      )}

      {comp.type === 'spacer' && (
        <Field label={t('prop.spacer.height')}>
          <input
            type="number"
            className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={parseInt(String(comp.props.height ?? '24'), 10) || 24}
            onChange={(e) =>
              updateSelected({
                props: { height: parseInt(e.target.value, 10) || 0 },
                stylesPatch: { base: { height: `${e.target.value || 0}px` } },
              })
            }
          />
        </Field>
      )}

      {comp.type === 'video' && (
        <>
          <Field label={t('prop.video.src')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.src ?? '')}
              onChange={(e) => updateSelected({ props: { src: e.target.value } })}
            />
          </Field>
          <Field label={t('prop.video.poster')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.poster ?? '')}
              onChange={(e) =>
                updateSelected({ props: { poster: e.target.value } })
              }
            />
          </Field>
        </>
      )}

      {comp.type === 'custom-html' && (
        <>
          <Field label={t('prop.customHtml.html')}>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-neutral-200 px-2 py-1 font-mono text-xs"
              value={String(comp.props.html ?? '')}
              onChange={(e) => updateSelected({ props: { html: e.target.value } })}
            />
          </Field>
          <Field label={t('prop.a11y.ariaLabel')}>
            <input
              className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
              value={String(comp.props.ariaLabel ?? '')}
              onChange={(e) =>
                updateSelected({ props: { ariaLabel: e.target.value } })
              }
            />
          </Field>
        </>
      )}
    </div>
  )
}
