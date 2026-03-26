import { getDefinition, type PropField } from '../registry/registry'
import { useAppStore } from '../store/useAppStore'
import { normalizeLayout, type LayoutState } from '../utils/componentLayout'

const inputClass =
  'w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm'
const labelClass = 'text-xs font-medium'
const subMuted = 'text-[11px] text-[color:var(--color-muted)]'

function LayoutInspectorSection({
  layout,
  onChange,
}: {
  layout: unknown
  onChange: (next: LayoutState) => void
}) {
  const L = normalizeLayout(layout)
  const showFlex = L.display === 'flex'
  const showGridFlexAlign = L.display === 'flex' || L.display === 'grid'

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
      <div className={labelClass}>Layout</div>

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

export function Inspector() {
  const selectedId = useAppStore((s) => s.selectedIds[0] ?? null)
  const node = useAppStore((s) => (selectedId ? s.components[selectedId] : null))
  const setProp = useAppStore((s) => s.setProp)

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Inspector</div>
        <div className="text-xs text-[color:var(--color-muted)]">{node.type}</div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
        <div className="text-xs text-[color:var(--color-muted)]">
          <div>
            ID: <code className="font-mono">{node.id}</code>
          </div>
        </div>
      </div>

      <LayoutInspectorSection
        layout={node.props.layout}
        onChange={(next) => setProp(node.id, 'layout', next)}
      />

      <div className="space-y-3">
        {Object.entries(inspector).map(([key, field]) => (
          <Field
            key={key}
            field={field}
            value={node.props[key]}
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
        ))}
        {!Object.keys(inspector).length ? (
          <div className="text-sm text-[color:var(--color-muted)]">No editable props.</div>
        ) : null}
      </div>
    </div>
  )
}

