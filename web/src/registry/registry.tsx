import type { ReactNode } from 'react'
import type { ComponentNode, ComponentType } from '../types/components'
import { DEFAULT_TYPOGRAPHY, normalizeTypography, typographyToStyle } from '../utils/typography'

export type PropField =
  | { kind: 'text'; label: string; placeholder?: string }
  | { kind: 'textarea'; label: string; placeholder?: string }
  | { kind: 'number'; label: string; min?: number; max?: number; step?: number }
  | { kind: 'boolean'; label: string }
  | { kind: 'select'; label: string; options: { label: string; value: string }[] }
  | { kind: 'links'; label: string }

export interface ComponentDefinition {
  type: ComponentType
  title: string
  icon?: string
  defaults?: Record<string, unknown>
  /** When true, inspector shows the typography section (font, size, weight, color, line-height, alignment). */
  supportsTypography?: boolean
  render: (node: ComponentNode, children: ReactNode[]) => ReactNode
  inspector?: Record<string, PropField>
}

function typoStyle(node: ComponentNode) {
  return typographyToStyle(normalizeTypography(node.props.typography))
}

export const registry: Record<ComponentType, ComponentDefinition> = {
  Root: {
    type: 'Root',
    title: 'Root',
    render: (_node, children) => (
      <div className="min-h-[420px] rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6">
        {children.length ? (
          <div className="space-y-4">{children}</div>
        ) : (
          <div className="text-sm text-[color:var(--color-muted)]">
            Drop components here (or click “Add” in the palette).
          </div>
        )}
      </div>
    ),
  },

  Button: {
    type: 'Button',
    title: 'Button',
    supportsTypography: true,
    defaults: {
      label: 'Button',
      variant: 'primary',
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      variant: {
        kind: 'select',
        label: 'Variant',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Ghost', value: 'ghost' },
        ],
      },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? 'Button'
      const variant = String(node.props.variant ?? 'primary')
      const typo = typoStyle(node)
      const base =
        'inline-flex max-w-full items-center justify-center rounded-md px-4 py-2 ring-offset-2 transition-colors'
      const skin =
        variant === 'secondary'
          ? 'border border-[color:var(--color-border)] bg-[color:var(--color-card)]'
          : variant === 'ghost'
            ? 'border border-transparent bg-transparent'
            : 'border border-transparent bg-[color:var(--color-primary)] text-white'
      return (
        <button className={`${base} ${skin}`} style={typo} type="button">
          {label}
        </button>
      )
    },
  },

  Text: {
    type: 'Text',
    title: 'Text',
    supportsTypography: true,
    defaults: { content: 'Edit me in the inspector.', typography: { ...DEFAULT_TYPOGRAPHY } },
    inspector: {
      content: { kind: 'textarea', label: 'Content' },
    },
    render: (node) => {
      const content = (node.props.content as string) ?? ''
      return (
        <p className="m-0 whitespace-pre-wrap" style={typoStyle(node)}>
          {content}
        </p>
      )
    },
  },

  InputText: {
    type: 'InputText',
    title: 'Text input',
    supportsTypography: true,
    defaults: {
      label: 'Label',
      placeholder: 'Type…',
      required: false,
      name: '',
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'field_name' },
      placeholder: { kind: 'text', label: 'Placeholder' },
      required: { kind: 'boolean', label: 'Required' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      return (
        <label className="block space-y-1" style={typoStyle(node)}>
          {label ? <div className="font-medium">{label}</div> : null}
          <input
            className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
            type="text"
          />
        </label>
      )
    },
  },

  InputEmail: {
    type: 'InputEmail',
    title: 'Email input',
    supportsTypography: true,
    defaults: {
      label: 'Email',
      placeholder: 'name@example.com',
      required: false,
      name: '',
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'email' },
      placeholder: { kind: 'text', label: 'Placeholder' },
      required: { kind: 'boolean', label: 'Required' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      return (
        <label className="block space-y-1" style={typoStyle(node)}>
          {label ? <div className="font-medium">{label}</div> : null}
          <input
            className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
            type="email"
          />
        </label>
      )
    },
  },

  InputNumber: {
    type: 'InputNumber',
    title: 'Number input',
    supportsTypography: true,
    defaults: {
      label: 'Number',
      placeholder: '',
      required: false,
      name: '',
      min: 0,
      max: 100,
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'amount' },
      placeholder: { kind: 'text', label: 'Placeholder' },
      min: { kind: 'number', label: 'Min' },
      max: { kind: 'number', label: 'Max' },
      required: { kind: 'boolean', label: 'Required' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      const min = node.props.min as number | undefined
      const max = node.props.max as number | undefined
      return (
        <label className="block space-y-1" style={typoStyle(node)}>
          {label ? <div className="font-medium">{label}</div> : null}
          <input
            className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
            max={typeof max === 'number' ? max : undefined}
            min={typeof min === 'number' ? min : undefined}
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
            type="number"
          />
        </label>
      )
    },
  },

  Textarea: {
    type: 'Textarea',
    title: 'Textarea',
    supportsTypography: true,
    defaults: {
      label: 'Message',
      placeholder: 'Write…',
      required: false,
      name: '',
      rows: 4,
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'message' },
      placeholder: { kind: 'text', label: 'Placeholder' },
      rows: { kind: 'number', label: 'Rows', min: 1, max: 20, step: 1 },
      required: { kind: 'boolean', label: 'Required' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      const rows = typeof node.props.rows === 'number' ? (node.props.rows as number) : 4
      return (
        <label className="block space-y-1" style={typoStyle(node)}>
          {label ? <div className="font-medium">{label}</div> : null}
          <textarea
            className="w-full resize-y rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
            rows={rows}
          />
        </label>
      )
    },
  },

  Select: {
    type: 'Select',
    title: 'Select',
    supportsTypography: true,
    defaults: {
      label: 'Select',
      name: '',
      required: false,
      options: ['Option A', 'Option B', 'Option C'],
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'choice' },
      required: { kind: 'boolean', label: 'Required' },
      options: { kind: 'textarea', label: 'Options (one per line)' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const optionsRaw = node.props.options
      const options =
        Array.isArray(optionsRaw) ? optionsRaw.map(String) : String(optionsRaw ?? '').split('\n')
      const normalized = options.map((o) => o.trim()).filter(Boolean)
      return (
        <label className="block space-y-1" style={typoStyle(node)}>
          {label ? <div className="font-medium">{label}</div> : null}
          <select
            className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
            name={name || undefined}
            required={required}
          >
            {normalized.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      )
    },
  },

  Checkbox: {
    type: 'Checkbox',
    title: 'Checkbox',
    supportsTypography: true,
    defaults: {
      label: 'Accept terms',
      name: '',
      required: false,
      checked: false,
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'accept_terms' },
      checked: { kind: 'boolean', label: 'Checked' },
      required: { kind: 'boolean', label: 'Required' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const checked = Boolean(node.props.checked)
      return (
        <label className="flex items-center gap-2" style={typoStyle(node)}>
          <input
            checked={checked}
            className="h-4 w-4 shrink-0 rounded border-[color:var(--color-border)]"
            name={name || undefined}
            required={required}
            type="checkbox"
            onChange={() => {
              // editor-only: real form state will be added later
            }}
          />
          <span>{label}</span>
        </label>
      )
    },
  },

  RadioGroup: {
    type: 'RadioGroup',
    title: 'Radio group',
    supportsTypography: true,
    defaults: {
      label: 'Radio',
      name: 'radio',
      required: false,
      options: ['One', 'Two'],
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      label: { kind: 'text', label: 'Label' },
      name: { kind: 'text', label: 'Name', placeholder: 'radio' },
      required: { kind: 'boolean', label: 'Required' },
      options: { kind: 'textarea', label: 'Options (one per line)' },
    },
    render: (node) => {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const optionsRaw = node.props.options
      const options =
        Array.isArray(optionsRaw) ? optionsRaw.map(String) : String(optionsRaw ?? '').split('\n')
      const normalized = options.map((o) => o.trim()).filter(Boolean)
      return (
        <fieldset className="space-y-2" style={typoStyle(node)}>
          {label ? <legend className="font-medium">{label}</legend> : null}
          <div className="space-y-1">
            {normalized.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  className="h-4 w-4 shrink-0"
                  name={name || undefined}
                  required={required}
                  type="radio"
                  value={opt}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )
    },
  },

  Card: {
    type: 'Card',
    title: 'Card',
    supportsTypography: true,
    defaults: {
      title: 'Card title',
      body: 'Card body',
      footer: 'Footer',
      showFooter: true,
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      title: { kind: 'text', label: 'Header' },
      body: { kind: 'textarea', label: 'Body' },
      footer: { kind: 'text', label: 'Footer' },
      showFooter: { kind: 'boolean', label: 'Show footer' },
    },
    render: (node) => {
      const title = (node.props.title as string) ?? ''
      const body = (node.props.body as string) ?? ''
      const footer = (node.props.footer as string) ?? ''
      const showFooter = Boolean(node.props.showFooter)
      return (
        <div
          className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)]"
          style={typoStyle(node)}
        >
          {title ? (
            <div className="border-b border-[color:var(--color-border)] px-4 py-3">
              <div className="font-semibold">{title}</div>
            </div>
          ) : null}
          <div className="whitespace-pre-wrap px-4 py-3 opacity-90">{body}</div>
          {showFooter ? (
            <div className="border-t border-[color:var(--color-border)] px-4 py-3 text-[0.9em] opacity-80">
              {footer}
            </div>
          ) : null}
        </div>
      )
    },
  },

  NavBar: {
    type: 'NavBar',
    title: 'Navigation bar',
    supportsTypography: true,
    defaults: {
      brand: 'Brand',
      links: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ],
      typography: { ...DEFAULT_TYPOGRAPHY },
    },
    inspector: {
      brand: { kind: 'text', label: 'Brand' },
      links: { kind: 'links', label: 'Links' },
    },
    render: (node) => {
      const brand = (node.props.brand as string) ?? ''
      const linksRaw = node.props.links
      const links: { label: string; href: string }[] = Array.isArray(linksRaw)
        ? (linksRaw as { label: string; href: string }[])
        : []
      return (
        <div
          className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3"
          style={typoStyle(node)}
        >
          <div className="font-semibold">{brand}</div>
          <nav className="flex items-center gap-3">
            {links.map((l, idx) => (
              <a
                key={`${l.href}-${idx}`}
                className="opacity-80 underline-offset-4 hover:opacity-100 hover:underline"
                href={l.href}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )
    },
  },
}

export function getDefinition(type: ComponentType): ComponentDefinition | null {
  return registry[type] ?? null
}

