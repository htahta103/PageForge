import type { CSSProperties } from 'react'
import type { BreakpointId, ComponentId, ComponentNode } from '../types/components'
import { BREAKPOINT_WIDTH_PX } from '../lib/breakpoints'
import {
  EXPORT_ROOT_ID,
  layoutStyleForNode,
  mapExportChildStrings,
  supportsTypography,
  typographyStyleForNode,
} from './exportShared'
import { cssPropsToTailwind, twMergeQuoted } from './styleToTailwind'

function safePropKey(...parts: string[]): string {
  const s = parts.filter(Boolean).join('_').replace(/[^a-zA-Z0-9_]/g, '_')
  if (!s) return 'prop'
  return /^[0-9]/.test(s) ? `_${s}` : s
}

function escapeJsxStrLiteral(value: string): string {
  return JSON.stringify(value)
}

function styleObjectToJsxLiteral(style: CSSProperties): string {
  const parts: string[] = []
  for (const [key, val] of Object.entries(style)) {
    if (val === undefined || val === null || val === '') continue
    if (typeof val === 'number') {
      parts.push(`${key}: ${val}`)
    } else {
      parts.push(`${key}: ${JSON.stringify(String(val))}`)
    }
  }
  return parts.length > 0 ? ` style={{ ${parts.join(', ')} }}` : ''
}

function wrapLayoutDiv(
  node: ComponentNode,
  structuralClasses: string,
  inner: string,
  baseIndent: string,
): string {
  const indent = `${baseIndent}  `
  const layout = layoutStyleForNode(node)
  const typoOnWrap = supportsTypography(node) && node.type !== 'Text' ? typographyStyleForNode(node) : {}
  const { classNames, inline } = cssPropsToTailwind({ ...layout, ...typoOnWrap })
  const layoutTw = twMergeQuoted(classNames)
  const allClasses = twMergeQuoted([layoutTw, structuralClasses].filter(Boolean))
  const stylePart = styleObjectToJsxLiteral(inline)
  const cls = allClasses ? ` className=${JSON.stringify(allClasses)}` : ''
  return `${indent}<div${cls}${stylePart}>\n${inner}\n${indent}</div>`
}

type PropEntry = { key: string; tsType: string; defaultExpr: string }

class PropBuilder {
  private props = new Map<string, PropEntry>()

  private add(entry: PropEntry): string {
    if (!this.props.has(entry.key)) this.props.set(entry.key, entry)
    return entry.key
  }

  registerString(nodeId: string, field: string, value: string): string {
    const key = safePropKey(field, nodeId)
    return this.add({ key, tsType: 'string', defaultExpr: escapeJsxStrLiteral(value) })
  }

  registerBoolean(nodeId: string, field: string, value: boolean): string {
    const key = safePropKey(field, nodeId)
    return this.add({ key, tsType: 'boolean', defaultExpr: String(value) })
  }

  registerNumber(nodeId: string, field: string, value: number): string {
    const key = safePropKey(field, nodeId)
    return this.add({ key, tsType: 'number', defaultExpr: String(value) })
  }

  registerStringArray(nodeId: string, field: string, value: string[]): string {
    const key = safePropKey(field, nodeId)
    return this.add({
      key,
      tsType: 'readonly string[]',
      defaultExpr: `Object.freeze(${JSON.stringify(value)}) as readonly string[]`,
    })
  }

  registerNavLinks(nodeId: string, value: { label: string; href: string }[]): string {
    const key = safePropKey('navLinks', nodeId)
    return this.add({
      key,
      tsType: 'readonly { label: string; href: string }[]',
      defaultExpr: `Object.freeze(${JSON.stringify(value)}) as readonly { label: string; href: string }[]`,
    })
  }

  emitInterface(): string {
    if (this.props.size === 0) {
      return 'export type ExportedPageProps = Record<string, never>\n'
    }
    const lines = [...this.props.values()].map((p) => `  ${p.key}: ${p.tsType}`)
    return `export type ExportedPageProps = {\n${lines.join('\n')}\n}\n`
  }

  emitDefaults(): string {
    if (this.props.size === 0) {
      return 'const defaultExportedPageProps = {} satisfies ExportedPageProps\n'
    }
    const lines = [...this.props.values()].map((p) => `  ${p.key}: ${p.defaultExpr},`)
    return `const defaultExportedPageProps: ExportedPageProps = {\n${lines.join('\n')}\n}\n`
  }
}

function typoClassAndStyle(node: ComponentNode): { cls: string; stylePart: string } {
  if (!supportsTypography(node)) return { cls: '', stylePart: '' }
  const { classNames, inline } = cssPropsToTailwind(typographyStyleForNode(node))
  const cls = twMergeQuoted(classNames)
  const stylePart = styleObjectToJsxLiteral(inline)
  return {
    cls: cls ? ` className=${JSON.stringify(cls)}` : '',
    stylePart,
  }
}

function renderInner(
  node: ComponentNode,
  childJsx: string,
  baseIndent: string,
  props: PropBuilder,
): string {
  const indent = `${baseIndent}  `
  const next = `${indent}  `
  const id = node.id

  switch (node.type) {
    case 'Root':
      if (!node.children.length) {
        return `${indent}<p className="m-0 text-sm text-neutral-500">Empty page</p>`
      }
      return `${indent}<div className="min-h-[420px] rounded-[12px] border border-dashed border-neutral-200 bg-white p-6">\n${indent}  <div className="flex flex-col space-y-4">\n${childJsx}\n${indent}  </div>\n${indent}</div>`

    case 'Text': {
      const content = (node.props.content as string) ?? ''
      const k = props.registerString(id, 'content', content)
      const { cls, stylePart } = typoClassAndStyle(node)
      return `${indent}<p className="m-0 whitespace-pre-wrap"${cls}${stylePart}>{p.${k}}</p>`
    }

    case 'Button': {
      const label = (node.props.label as string) ?? 'Button'
      const variant = String(node.props.variant ?? 'primary')
      const k = props.registerString(id, 'label', label)
      const skin =
        variant === 'secondary'
          ? 'inline-flex max-w-full items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 font-inherit text-inherit transition-colors hover:bg-neutral-50'
          : variant === 'ghost'
            ? 'inline-flex max-w-full items-center justify-center rounded-md border border-transparent bg-transparent px-4 py-2 font-inherit text-inherit'
            : 'inline-flex max-w-full items-center justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 font-inherit text-violet-50 transition-colors hover:bg-violet-700'
      const { cls, stylePart } = typoClassAndStyle(node)
      return `${indent}<button type="button" className=${JSON.stringify(skin)}${cls}${stylePart}>{p.${k}}</button>`
    }

    case 'InputText':
    case 'InputEmail':
    case 'InputNumber': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      const inputType = node.type === 'InputEmail' ? 'email' : node.type === 'InputNumber' ? 'number' : 'text'
      const labelKey = label ? props.registerString(id, 'label', label) : ''
      const nameKey = name ? props.registerString(id, 'name', name) : ''
      const phKey = placeholder ? props.registerString(id, 'placeholder', placeholder) : ''
      const reqKey = props.registerBoolean(id, 'required', required)
      const { cls, stylePart } = typoClassAndStyle(node)
      let extraFields = ''
      if (node.type === 'InputNumber') {
        const min = node.props.min as number | undefined
        const max = node.props.max as number | undefined
        if (typeof min === 'number') extraFields += ` min={p.${props.registerNumber(id, 'min', min)}}`
        if (typeof max === 'number') extraFields += ` max={p.${props.registerNumber(id, 'max', max)}}`
      }
      const labelBlock = label ? `${next}<div className="mb-1 font-medium">{p.${labelKey}}</div>\n` : ''
      const nameAttr = name ? ` name={p.${nameKey}}` : ''
      const phAttr = placeholder ? ` placeholder={p.${phKey}}` : ''
      return `${indent}<label className="block"${cls}${stylePart}>
${labelBlock}${next}<input className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-inherit text-inherit" type="${inputType}"${nameAttr}${phAttr} required={p.${reqKey}}${extraFields} />
${indent}</label>`
    }

    case 'Textarea': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      const rows = typeof node.props.rows === 'number' ? node.props.rows : 4
      const labelKey = label ? props.registerString(id, 'label', label) : ''
      const nameKey = name ? props.registerString(id, 'name', name) : ''
      const phKey = placeholder ? props.registerString(id, 'placeholder', placeholder) : ''
      const reqKey = props.registerBoolean(id, 'required', required)
      const rowsKey = props.registerNumber(id, 'rows', rows)
      const { cls, stylePart } = typoClassAndStyle(node)
      const labelBlock = label ? `${next}<div className="mb-1 font-medium">{p.${labelKey}}</div>\n` : ''
      const nameAttr = name ? ` name={p.${nameKey}}` : ''
      const phAttr = placeholder ? ` placeholder={p.${phKey}}` : ''
      return `${indent}<label className="block"${cls}${stylePart}>
${labelBlock}${next}<textarea className="w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 font-inherit text-inherit" rows={p.${rowsKey}}${nameAttr}${phAttr} required={p.${reqKey}} />
${indent}</label>`
    }

    case 'Select': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const optionsRaw = node.props.options
      const options = Array.isArray(optionsRaw)
        ? optionsRaw.map(String)
        : String(optionsRaw ?? '').split('\n')
      const normalized = options.map((o) => o.trim()).filter(Boolean)
      const labelKey = label ? props.registerString(id, 'label', label) : ''
      const nameKey = name ? props.registerString(id, 'name', name) : ''
      const reqKey = props.registerBoolean(id, 'required', required)
      const optsKey = props.registerStringArray(id, 'options', normalized)
      const { cls, stylePart } = typoClassAndStyle(node)
      const labelBlock = label ? `${next}<div className="mb-1 font-medium">{p.${labelKey}}</div>\n` : ''
      const nameAttr = name ? ` name={p.${nameKey}}` : ''
      return `${indent}<label className="block"${cls}${stylePart}>
${labelBlock}${next}<select className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-inherit text-inherit"${nameAttr} required={p.${reqKey}}>
${next}  {p.${optsKey}.map((opt) => (
${next}    <option key={opt} value={opt}>{opt}</option>
${next}  ))}
${next}</select>
${indent}</label>`
    }

    case 'Checkbox': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const checked = Boolean(node.props.checked)
      const labelKey = props.registerString(id, 'label', label)
      const nameKey = name ? props.registerString(id, 'name', name) : ''
      const reqKey = props.registerBoolean(id, 'required', required)
      const checkedKey = props.registerBoolean(id, 'checked', checked)
      const { cls, stylePart } = typoClassAndStyle(node)
      const nameAttr = name ? ` name={p.${nameKey}}` : ''
      return `${indent}<label className="flex items-center gap-2"${cls}${stylePart}>
${next}<input type="checkbox"${nameAttr} className="h-4 w-4 shrink-0 rounded border border-neutral-200" required={p.${reqKey}} defaultChecked={p.${checkedKey}} />
${next}<span>{p.${labelKey}}</span>
${indent}</label>`
    }

    case 'RadioGroup': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const optionsRaw = node.props.options
      const options = Array.isArray(optionsRaw)
        ? optionsRaw.map(String)
        : String(optionsRaw ?? '').split('\n')
      const normalized = options.map((o) => o.trim()).filter(Boolean)
      const labelKey = label ? props.registerString(id, 'label', label) : ''
      const nameKey = name ? props.registerString(id, 'name', name) : ''
      const reqKey = props.registerBoolean(id, 'required', required)
      const optsKey = props.registerStringArray(id, 'radioOptions', normalized)
      const { cls, stylePart } = typoClassAndStyle(node)
      const legend = label ? `${next}<legend className="mb-2 font-medium">{p.${labelKey}}</legend>\n` : ''
      const nameAttr = name ? ` name={p.${nameKey}}` : ''
      return `${indent}<fieldset className="space-y-1 border-0 p-0"${cls}${stylePart}>
${legend}${next}{p.${optsKey}.map((opt, i) => (
${next}  <label key={opt} className="flex items-center gap-2">
${next}    <input type="radio"${nameAttr} value={opt} className="h-4 w-4 shrink-0" required={i === 0 ? p.${reqKey} : false} />
${next}    <span>{opt}</span>
${next}  </label>
${next}))}
${indent}</fieldset>`
    }

    case 'Card': {
      const title = (node.props.title as string) ?? ''
      const body = (node.props.body as string) ?? ''
      const footer = (node.props.footer as string) ?? ''
      const showFooter = Boolean(node.props.showFooter)
      const titleKey = title ? props.registerString(id, 'title', title) : ''
      const bodyKey = props.registerString(id, 'body', body)
      const footerKey = props.registerString(id, 'footer', footer)
      const showFooterKey = props.registerBoolean(id, 'showFooter', showFooter)
      const { cls, stylePart } = typoClassAndStyle(node)
      const head =
        title ?
          `${next}<div className="border-b border-neutral-200 px-4 py-3">\n${next}  <div className="font-semibold">{p.${titleKey}}</div>\n${next}</div>\n`
        : ''
      const foot = `${next}{p.${showFooterKey} ? (\n${next}  <div className="border-t border-neutral-200 px-4 py-3 text-sm opacity-80">{p.${footerKey}}</div>\n${next}) : null}\n`
      return `${indent}<article className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white"${cls}${stylePart}>
${head}${next}<div className="whitespace-pre-wrap px-4 py-3 opacity-90">{p.${bodyKey}}</div>
${foot}${indent}</article>`
    }

    case 'NavBar': {
      const brand = (node.props.brand as string) ?? ''
      const linksRaw = node.props.links
      const links: { label: string; href: string }[] = Array.isArray(linksRaw)
        ? (linksRaw as { label: string; href: string }[])
        : []
      const brandKey = props.registerString(id, 'brand', brand)
      const linksKey = props.registerNavLinks(id, links.length ? links : [{ label: 'Home', href: '#' }])
      const { cls, stylePart } = typoClassAndStyle(node)
      return `${indent}<header className="flex items-center justify-between gap-4 rounded-[12px] border border-neutral-200 bg-white px-4 py-3"${cls}${stylePart}>
${next}<div className="font-semibold">{p.${brandKey}}</div>
${next}<nav className="flex items-center gap-3" aria-label="Primary">
${next}  {p.${linksKey}.map((l) => (
${next}    <a key={l.href + l.label} href={l.href} className="text-inherit opacity-80 no-underline underline-offset-4 hover:opacity-100 hover:underline">
${next}      {l.label}
${next}    </a>
${next}  ))}
${next}</nav>
${indent}</header>`
    }

    default:
      return `${indent}<div className="m-0 text-sm text-neutral-500">Unknown component: ${escapeJsxStrLiteral(node.type)}</div>`
  }
}

function exportNodeSubtree(
  id: ComponentId,
  components: Record<string, ComponentNode>,
  indent: string,
  props: PropBuilder,
): string {
  const node = components[id]
  if (!node) return ''

  const childBlocks = mapExportChildStrings(node, indent, (cid, ind) =>
    exportNodeSubtree(cid, components, ind, props),
  )

  const childInner = childBlocks.join('\n')
  const inner = renderInner(node, childInner, indent, props)
  return wrapLayoutDiv(node, 'rounded-md', inner, indent)
}

const FILE_PREAMBLE = `/* eslint-disable react-refresh/only-export-components */
/* Generated by Pageforge — React + Tailwind export */
`

/** Single-file component: default export + typed props for dynamic copy. */
export function buildExportedReactTailwind(
  components: Record<string, ComponentNode>,
  breakpoint: BreakpointId,
): string {
  const props = new PropBuilder()
  const bodyInner = exportNodeSubtree(EXPORT_ROOT_ID, components, '      ', props)
  const widthPx = BREAKPOINT_WIDTH_PX[breakpoint]

  return `${FILE_PREAMBLE}
${props.emitInterface()}
${props.emitDefaults()}
export default function ExportedPage(props: Partial<ExportedPageProps> = {}) {
  const p = { ...defaultExportedPageProps, ...props }
  return (
    <div className="min-h-screen bg-neutral-100 py-6 px-4">
      <main className="mx-auto max-w-full rounded-[12px] border border-neutral-200 bg-white p-2 shadow-sm" style={{ width: ${widthPx} }}>
${bodyInner}
      </main>
    </div>
  )
}
`
}
