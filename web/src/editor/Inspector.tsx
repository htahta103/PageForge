import { getDefinition, type PropField } from '../registry/registry'
import { useAppStore } from '../store/useAppStore'

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

