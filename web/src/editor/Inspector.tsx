import { getDefinition, type PropField } from '../registry/registry'
import { isNodeLocked, useAppStore } from '../store/useAppStore'
import type { BreakpointId } from '../types/components'
import { normalizeLayout, type LayoutState } from '../utils/componentLayout'
import { isPropOverridden, resolvePropsForBreakpoint } from '../utils/resolveBreakpointProps'
import {
  DEFAULT_TYPOGRAPHY,
  FONT_PRESETS,
  TYPOGRAPHY_WEIGHT_OPTIONS,
  normalizeTypography,
  type TextAlign,
  type TypographyState,
} from '../utils/typography'

const inputClass =
  'w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm'
const labelClass = 'text-xs font-medium'
const subMuted = 'text-[11px] text-[color:var(--color-muted)]'

function OverrideChrome({
  activeBreakpoint,
  isOverridden,
  onClear,
}: {
  activeBreakpoint: BreakpointId
  isOverridden: boolean
  onClear?: () => void
}) {
  if (activeBreakpoint === 'desktop') return null
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <span
        className={[
          'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          isOverridden
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100'
            : 'bg-black/5 text-[color:var(--color-muted)]',
        ].join(' ')}
      >
        {isOverridden ? 'Overridden' : 'Inherited'}
      </span>
      {isOverridden && onClear ? (
        <button
          className="text-[11px] text-[color:var(--color-primary)] underline decoration-dotted hover:opacity-80"
          type="button"
          onClick={onClear}
        >
          Clear override
        </button>
      ) : null}
    </div>
  )
}

function LayoutInspectorSection({
  layout,
  onChange,
  activeBreakpoint,
  isOverridden,
  onClearOverride,
}: {
  layout: unknown
  onChange: (next: LayoutState) => void
  activeBreakpoint: BreakpointId
  isOverridden: boolean
  onClearOverride?: () => void
}) {
  const L = normalizeLayout(layout)
  const showFlex = L.display === 'flex'
  const showGridFlexAlign = L.display === 'flex' || L.display === 'grid'

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
      <div className={labelClass}>Layout</div>
      <OverrideChrome
        activeBreakpoint={activeBreakpoint}
        isOverridden={isOverridden}
        onClear={onClearOverride}
      />

      <label className="block space-y-1">
        <div className={subMuted}>Display</div>
        <select
          className={inputClass}
          value={L.display}
          onChange={(e) =>
            onChange({
              ...L,
              display: e.target.value as LayoutState['display'],
            })
          }
        >
          <option value="block">Block</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
        </select>
      </label>

      {showFlex ? (
        <>
          <label className="block space-y-1">
            <div className={subMuted}>Flex direction</div>
            <select
              className={inputClass}
              value={L.flexDirection}
              onChange={(e) =>
                onChange({
                  ...L,
                  flexDirection: e.target.value as LayoutState['flexDirection'],
                })
              }
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
              <option value="row-reverse">Row reverse</option>
              <option value="column-reverse">Column reverse</option>
            </select>
          </label>
          <label className="block space-y-1">
            <div className={subMuted}>Flex wrap</div>
            <select
              className={inputClass}
              value={L.flexWrap}
              onChange={(e) =>
                onChange({ ...L, flexWrap: e.target.value as LayoutState['flexWrap'] })
              }
            >
              <option value="nowrap">No wrap</option>
              <option value="wrap">Wrap</option>
              <option value="wrap-reverse">Wrap reverse</option>
            </select>
          </label>
        </>
      ) : null}

      {showGridFlexAlign ? (
        <>
          <label className="block space-y-1">
            <div className={subMuted}>Justify content</div>
            <select
              className={inputClass}
              value={L.justifyContent}
              onChange={(e) =>
                onChange({
                  ...L,
                  justifyContent: e.target.value as LayoutState['justifyContent'],
                })
              }
            >
              <option value="flex-start">Start</option>
              <option value="flex-end">End</option>
              <option value="center">Center</option>
              <option value="space-between">Space between</option>
              <option value="space-around">Space around</option>
              <option value="space-evenly">Space evenly</option>
            </select>
          </label>
          <label className="block space-y-1">
            <div className={subMuted}>Align items</div>
            <select
              className={inputClass}
              value={L.alignItems}
              onChange={(e) =>
                onChange({ ...L, alignItems: e.target.value as LayoutState['alignItems'] })
              }
            >
              <option value="flex-start">Start</option>
              <option value="flex-end">End</option>
              <option value="center">Center</option>
              <option value="stretch">Stretch</option>
              <option value="baseline">Baseline</option>
            </select>
          </label>
        </>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <div className={subMuted}>Width</div>
          <select
            className={inputClass}
            value={L.width.mode}
            onChange={(e) =>
              onChange({
                ...L,
                width: { ...L.width, mode: e.target.value as LayoutState['width']['mode'] },
              })
            }
          >
            <option value="auto">Auto</option>
            <option value="px">px</option>
            <option value="%">%</option>
          </select>
        </label>
        <label className="block space-y-1">
          <div className={subMuted}>Width value</div>
          <input
            className={inputClass}
            disabled={L.width.mode === 'auto'}
            placeholder={L.width.mode === 'auto' ? '—' : 'e.g. 320'}
            type="text"
            inputMode="decimal"
            value={L.width.value}
            onChange={(e) => onChange({ ...L, width: { ...L.width, value: e.target.value } })}
          />
        </label>
        <label className="block space-y-1">
          <div className={subMuted}>Height</div>
          <select
            className={inputClass}
            value={L.height.mode}
            onChange={(e) =>
              onChange({
                ...L,
                height: { ...L.height, mode: e.target.value as LayoutState['height']['mode'] },
              })
            }
          >
            <option value="auto">Auto</option>
            <option value="px">px</option>
            <option value="%">%</option>
          </select>
        </label>
        <label className="block space-y-1">
          <div className={subMuted}>Height value</div>
          <input
            className={inputClass}
            disabled={L.height.mode === 'auto'}
            placeholder={L.height.mode === 'auto' ? '—' : 'e.g. 240'}
            type="text"
            inputMode="decimal"
            value={L.height.value}
            onChange={(e) => onChange({ ...L, height: { ...L.height, value: e.target.value } })}
          />
        </label>
      </div>

      <div className="space-y-1">
        <div className={subMuted}>Padding (per side)</div>
        <div className="mb-1">
          <label className="inline-flex items-center gap-2 text-[11px]">
            Unit
            <select
              className={`${inputClass} !py-1`}
              value={L.padding.unit}
              onChange={(e) =>
                onChange({
                  ...L,
                  padding: {
                    ...L.padding,
                    unit: e.target.value as LayoutState['padding']['unit'],
                  },
                })
              }
            >
              <option value="px">px</option>
              <option value="%">%</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <label key={side} className="block space-y-0.5">
              <div className="text-[10px] uppercase text-[color:var(--color-muted)]">{side[0]}</div>
              <input
                className={`${inputClass} !px-2 !py-1 text-xs`}
                placeholder="0"
                type="text"
                inputMode="decimal"
                value={L.padding[side]}
                onChange={(e) =>
                  onChange({
                    ...L,
                    padding: { ...L.padding, [side]: e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className={subMuted}>Margin (per side)</div>
        <div className="mb-1">
          <label className="inline-flex items-center gap-2 text-[11px]">
            Unit
            <select
              className={`${inputClass} !py-1`}
              value={L.margin.unit}
              onChange={(e) =>
                onChange({
                  ...L,
                  margin: {
                    ...L.margin,
                    unit: e.target.value as LayoutState['margin']['unit'],
                  },
                })
              }
            >
              <option value="px">px</option>
              <option value="%">%</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <label key={side} className="block space-y-0.5">
              <div className="text-[10px] uppercase text-[color:var(--color-muted)]">{side[0]}</div>
              <input
                className={`${inputClass} !px-2 !py-1 text-xs`}
                placeholder="0"
                type="text"
                inputMode="decimal"
                value={L.margin[side]}
                onChange={(e) =>
                  onChange({
                    ...L,
                    margin: { ...L.margin, [side]: e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: PropField
  value: unknown
  onChange: (value: unknown) => void
}) {
  if (field.kind === 'text') {
    return (
      <label className="block space-y-1">
        <div className="text-xs font-medium">{field.label}</div>
        <input
          className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
          placeholder={field.placeholder}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    )
  }

  if (field.kind === 'textarea') {
    return (
      <label className="block space-y-1">
        <div className="text-xs font-medium">{field.label}</div>
        <textarea
          className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
          placeholder={field.placeholder}
          rows={5}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    )
  }

  if (field.kind === 'number') {
    const v = typeof value === 'number' ? value : value == null || value === '' ? '' : Number(value)
    return (
      <label className="block space-y-1">
        <div className="text-xs font-medium">{field.label}</div>
        <input
          className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
          max={field.max}
          min={field.min}
          step={field.step}
          type="number"
          value={v as number | string}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </label>
    )
  }

  if (field.kind === 'boolean') {
    return (
      <label className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2">
        <div className="text-xs font-medium">{field.label}</div>
        <input
          checked={Boolean(value)}
          type="checkbox"
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    )
  }

  if (field.kind === 'select') {
    return (
      <label className="block space-y-1">
        <div className="text-xs font-medium">{field.label}</div>
        <select
          className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.kind === 'links') {
    const links: { label: string; href: string }[] = Array.isArray(value)
      ? (value as { label: string; href: string }[])
      : []
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium">{field.label}</div>
        <div className="space-y-2">
          {links.map((l, idx) => (
            <div
              key={`${l.href}-${idx}`}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2"
            >
              <label className="block space-y-1">
                <div className="text-[11px] text-[color:var(--color-muted)]">Label</div>
                <input
                  className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-2 py-1 text-sm"
                  value={l.label}
                  onChange={(e) => {
                    const next = links.slice()
                    next[idx] = { ...l, label: e.target.value }
                    onChange(next)
                  }}
                />
              </label>
              <label className="mt-2 block space-y-1">
                <div className="text-[11px] text-[color:var(--color-muted)]">Href</div>
                <input
                  className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-2 py-1 text-sm"
                  value={l.href}
                  onChange={(e) => {
                    const next = links.slice()
                    next[idx] = { ...l, href: e.target.value }
                    onChange(next)
                  }}
                />
              </label>
              <button
                className="mt-2 rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs hover:bg-black/5"
                type="button"
                onClick={() => {
                  const next = links.slice()
                  next.splice(idx, 1)
                  onChange(next)
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="w-full rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs hover:bg-black/5"
          type="button"
          onClick={() => onChange([...links, { label: 'Link', href: '#' }])}
        >
          Add link
        </button>
      </div>
    )
  }

  return null
}

function TypographyInspectorSection({
  typography,
  onChange,
}: {
  typography: unknown
  onChange: (next: TypographyState) => void
}) {
  const T = normalizeTypography(typography)

  const setAlign = (textAlign: TextAlign) => onChange({ ...T, textAlign })

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
      <div className={labelClass}>Typography</div>

      <label className="block space-y-1">
        <div className={subMuted}>Font</div>
        <select
          className={inputClass}
          value={T.fontFamily}
          onChange={(e) => onChange({ ...T, fontFamily: e.target.value })}
        >
          {FONT_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <div className={subMuted}>Size (px)</div>
          <input
            className={inputClass}
            min={8}
            max={288}
            type="number"
            value={T.fontSize}
            onChange={(e) => onChange({ ...T, fontSize: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <div className={subMuted}>Weight</div>
          <select
            className={inputClass}
            value={T.fontWeight}
            onChange={(e) => onChange({ ...T, fontWeight: e.target.value })}
          >
            {TYPOGRAPHY_WEIGHT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <div className={subMuted}>Color</div>
        <div className="flex items-center gap-2">
          <input
            aria-label="Text color"
            className="h-9 w-14 cursor-pointer rounded border border-[color:var(--color-border)] bg-white"
            type="color"
            value={T.color}
            onChange={(e) => onChange({ ...T, color: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="#111827"
            spellCheck={false}
            type="text"
            value={T.color}
            onChange={(e) => onChange({ ...T, color: e.target.value })}
          />
        </div>
      </label>

      <label className="block space-y-1">
        <div className={subMuted}>Line height</div>
        <input
          className={inputClass}
          placeholder="1.5 or 24px"
          type="text"
          value={T.lineHeight}
          onChange={(e) => onChange({ ...T, lineHeight: e.target.value })}
        />
      </label>

      <div className="space-y-1">
        <div className={subMuted}>Alignment</div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ['left', 'Left'],
              ['center', 'Center'],
              ['right', 'Right'],
              ['justify', 'Justify'],
            ] as const
          ).map(([val, lbl]) => (
            <button
              key={val}
              className={[
                'rounded-md border px-2 py-1 text-xs',
                T.textAlign === val
                  ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10'
                  : 'border-[color:var(--color-border)] hover:bg-black/5',
              ].join(' ')}
              type="button"
              onClick={() => setAlign(val)}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <button
        className="w-full rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs hover:bg-black/5"
        type="button"
        onClick={() => onChange({ ...DEFAULT_TYPOGRAPHY })}
      >
        Reset typography
      </button>
    </div>
  )
}

const ROOT_ID = 'root'

export function Inspector() {
  const selectedId = useAppStore((s) => s.selectedIds[0] ?? null)
  const node = useAppStore((s) => (selectedId ? s.components[selectedId] : null))
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint)
  const setProp = useAppStore((s) => s.setProp)
  const deleteComponents = useAppStore((s) => s.deleteComponents)
  const clearPropOverride = useAppStore((s) => s.clearPropOverride)

  if (!selectedId || !node) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold">Inspector</div>
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 text-sm text-[color:var(--color-muted)]">
          Select a component on the canvas to edit its properties.
        </div>
      </div>
    )
  }

  const def = getDefinition(node.type)
  const inspector = def?.inspector ?? {}
  const showTypography = Boolean(def?.supportsTypography)
  const resolvedProps = resolvePropsForBreakpoint(node, activeBreakpoint)
  const layoutOverridden = isPropOverridden(node, activeBreakpoint, 'layout')
  const typographyOverridden = isPropOverridden(node, activeBreakpoint, 'typography')
  const locked = isNodeLocked(node)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Inspector</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-[color:var(--color-muted)]">{node.type}</div>
          {selectedId !== ROOT_ID ? (
            <button
              type="button"
              disabled={locked}
              title={locked ? 'Unlock layer in the layer tree to delete' : undefined}
              className={[
                'rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-red-700',
                locked ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-50',
              ].join(' ')}
              onClick={() => {
                if (locked) return
                deleteComponents([selectedId])
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {activeBreakpoint !== 'desktop' ? (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
          Editing <span className="font-semibold capitalize text-[color:var(--color-fg)]">{activeBreakpoint}</span>{' '}
          overrides. Unset fields use the desktop base.
        </div>
      ) : null}

      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
        <div className="text-xs text-[color:var(--color-muted)]">
          <div>
            ID: <code className="font-mono">{node.id}</code>
          </div>
        </div>
      </div>

      {locked ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          This layer is locked. Unlock it in the layer tree to edit properties.
        </div>
      ) : (
        <>
          <LayoutInspectorSection
            layout={resolvedProps.layout}
            activeBreakpoint={activeBreakpoint}
            isOverridden={layoutOverridden}
            onClearOverride={
              layoutOverridden ? () => clearPropOverride(node.id, 'layout') : undefined
            }
            onChange={(next) => setProp(node.id, 'layout', next)}
          />

          {showTypography ? (
            <div className="space-y-2">
              <OverrideChrome
                activeBreakpoint={activeBreakpoint}
                isOverridden={typographyOverridden}
                onClear={
                  typographyOverridden
                    ? () => clearPropOverride(node.id, 'typography')
                    : undefined
                }
              />
              <TypographyInspectorSection
                typography={resolvedProps.typography}
                onChange={(next) => setProp(node.id, 'typography', next)}
              />
            </div>
          ) : null}

          <div className="space-y-3">
            {Object.entries(inspector).map(([key, field]) => {
              const overridden = isPropOverridden(node, activeBreakpoint, key)
              return (
                <div key={key}>
                  <OverrideChrome
                    activeBreakpoint={activeBreakpoint}
                    isOverridden={overridden}
                    onClear={overridden ? () => clearPropOverride(node.id, key) : undefined}
                  />
                  <Field
                    field={field}
                    value={resolvedProps[key]}
                    onChange={(v) => {
                      if (node.type === 'Select' && key === 'options' && typeof v === 'string') {
                        const lines = v
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                        setProp(node.id, key, lines)
                        return
                      }
                      if (node.type === 'RadioGroup' && key === 'options' && typeof v === 'string') {
                        const lines = v
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                        setProp(node.id, key, lines)
                        return
                      }
                      setProp(node.id, key, v)
                    }}
                  />
                </div>
              )
            })}
            {!Object.keys(inspector).length ? (
              <div className="text-sm text-[color:var(--color-muted)]">No editable props.</div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

