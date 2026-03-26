import type { CSSProperties } from 'react'
import type { BreakpointId, ComponentId, ComponentNode } from '../types/components'
import { BREAKPOINT_WIDTH_PX } from '../lib/breakpoints'
import { layoutToStyle, normalizeLayout } from './componentLayout'
import { normalizeTypography, typographyToStyle } from './typography'

const ROOT_ID: ComponentId = 'root'

const THEME_CSS = `
:root {
  --color-bg: oklch(0.985 0 0);
  --color-fg: oklch(0.2 0 0);
  --color-muted: oklch(0.55 0 0);
  --color-border: oklch(0.9 0 0);
  --color-card: oklch(1 0 0);
  --color-primary: oklch(0.63 0.25 285);
  --color-primary-foreground: oklch(0.99 0 0);
  --radius-md: 12px;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-fg);
}

.pf-export-frame {
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.pf-page-body {
  min-height: 100vh;
  padding: 24px 16px;
  background: color-mix(in oklch, var(--color-muted) 10%, transparent);
}

.pf-root-inner {
  min-height: 420px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  background: var(--color-card);
  padding: 24px;
}

.pf-stack > * + * {
  margin-top: 1rem;
}

.pf-node-wrap {
  border-radius: var(--radius-md);
}

.pf-empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.pf-text {
  margin: 0;
  white-space: pre-wrap;
}

.pf-label-block {
  display: block;
}

.pf-label-block > .pf-label-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.pf-label-block > .pf-label-title:empty {
  display: none;
}

.pf-input-like {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: #fff;
  padding: 8px 12px;
  font: inherit;
  color: inherit;
}

textarea.pf-input-like {
  resize: vertical;
}

.pf-btn {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 8px 16px;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s;
}

.pf-btn--primary {
  border: 1px solid transparent;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.pf-btn--secondary {
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: inherit;
}

.pf-btn--ghost {
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
}

.pf-card {
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-card);
}

.pf-card__header {
  border-bottom: 1px solid var(--color-border);
  padding: 12px 16px;
}

.pf-card__title {
  font-weight: 600;
}

.pf-card__body {
  white-space: pre-wrap;
  padding: 12px 16px;
  opacity: 0.9;
}

.pf-card__footer {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  font-size: 0.9em;
  opacity: 0.8;
}

.pf-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-card);
  padding: 12px 16px;
}

.pf-navbar__brand {
  font-weight: 600;
}

.pf-navbar__nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pf-navbar__nav a {
  color: inherit;
  text-decoration: none;
  opacity: 0.8;
  text-underline-offset: 4px;
}

.pf-navbar__nav a:hover {
  opacity: 1;
  text-decoration: underline;
}

.pf-check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pf-check input {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.pf-fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.pf-fieldset > legend {
  font-weight: 500;
  padding: 0;
  margin-bottom: 8px;
}

.pf-radio-stack > * + * {
  margin-top: 0.25rem;
}

.pf-radio-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pf-radio-row input {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
`

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(raw: string): string {
  return escapeHtml(raw).replace(/\n/g, '&#10;')
}

function serializeCssValue(key: string, val: unknown): string {
  if (typeof val === 'number') {
    if (key === 'fontWeight' || key === 'opacity' || key === 'zIndex') return String(val)
    if (key === 'lineHeight') return String(val)
    return `${val}px`
  }
  return String(val)
}

function styleObjectToString(style: CSSProperties): string {
  const parts: string[] = []
  for (const [key, val] of Object.entries(style)) {
    if (val === undefined || val === null || val === '') continue
    const cssKey = key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)
    parts.push(`${cssKey}: ${serializeCssValue(key, val)}`)
  }
  return parts.join('; ')
}

function wrapStyles(layoutStyle: string, inner: string, indent: string): string {
  const st = layoutStyle.trim()
  if (!st) {
    return `${indent}<div class="pf-node-wrap">\n${inner}\n${indent}</div>`
  }
  return `${indent}<div class="pf-node-wrap" style="${escapeAttr(st)}">\n${inner}\n${indent}</div>`
}

function typo(node: ComponentNode): CSSProperties {
  return typographyToStyle(normalizeTypography(node.props.typography))
}

function supportsTypography(node: ComponentNode): boolean {
  const t = node.type
  return (
    t === 'Button' ||
    t === 'Text' ||
    t === 'InputText' ||
    t === 'InputEmail' ||
    t === 'InputNumber' ||
    t === 'Textarea' ||
    t === 'Select' ||
    t === 'Checkbox' ||
    t === 'RadioGroup' ||
    t === 'Card' ||
    t === 'NavBar'
  )
}

function typoStyleString(node: ComponentNode): string {
  if (!supportsTypography(node)) return ''
  return styleObjectToString(typo(node))
}

function renderInner(node: ComponentNode, childHtml: string, baseIndent: string): string {
  const indent = `${baseIndent}  `
  const next = `${indent}  `

  switch (node.type) {
    case 'Root': {
      if (!node.children.length) {
        return `${indent}<p class="pf-empty">Empty page</p>`
      }
      return `${indent}<div class="pf-root-inner">\n${indent}  <div class="pf-stack">\n${childHtml}\n${indent}  </div>\n${indent}</div>`
    }
    case 'Text': {
      const content = (node.props.content as string) ?? ''
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      return `${indent}<p class="pf-text"${styleAttr}>${escapeHtml(content)}</p>`
    }
    case 'Button': {
      const label = (node.props.label as string) ?? 'Button'
      const variant = String(node.props.variant ?? 'primary')
      const skin =
        variant === 'secondary' ? 'pf-btn pf-btn--secondary' : variant === 'ghost' ? 'pf-btn pf-btn--ghost' : 'pf-btn pf-btn--primary'
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      return `${indent}<button type="button" class="${skin}"${styleAttr}>${escapeHtml(label)}</button>`
    }
    case 'InputText':
    case 'InputEmail':
    case 'InputNumber': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      const inputType = node.type === 'InputEmail' ? 'email' : node.type === 'InputNumber' ? 'number' : 'text'
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      let extra = ''
      if (node.type === 'InputNumber') {
        const min = node.props.min as number | undefined
        const max = node.props.max as number | undefined
        if (typeof min === 'number') extra += ` min="${min}"`
        if (typeof max === 'number') extra += ` max="${max}"`
      }
      return `${indent}<label class="pf-label-block"${styleAttr}>
${label ? `${next}<div class="pf-label-title">${escapeHtml(label)}</div>\n` : ''}${next}<input class="pf-input-like" type="${inputType}"${name ? ` name="${escapeAttr(name)}"` : ''}${placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : ''}${required ? ' required' : ''}${extra} />
${indent}</label>`
    }
    case 'Textarea': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const placeholder = (node.props.placeholder as string) ?? ''
      const required = Boolean(node.props.required)
      const rows = typeof node.props.rows === 'number' ? node.props.rows : 4
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      return `${indent}<label class="pf-label-block"${styleAttr}>
${label ? `${next}<div class="pf-label-title">${escapeHtml(label)}</div>\n` : ''}${next}<textarea class="pf-input-like" rows="${rows}"${name ? ` name="${escapeAttr(name)}"` : ''}${placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : ''}${required ? ' required' : ''}></textarea>
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
      const opts = normalized
        .map(
          (opt) =>
            `${next}  <option value="${escapeAttr(opt)}">${escapeHtml(opt)}</option>`,
        )
        .join('\n')
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      return `${indent}<label class="pf-label-block"${styleAttr}>
${label ? `${next}<div class="pf-label-title">${escapeHtml(label)}</div>\n` : ''}${next}<select class="pf-input-like"${name ? ` name="${escapeAttr(name)}"` : ''}${required ? ' required' : ''}>
${opts}
${next}</select>
${indent}</label>`
    }
    case 'Checkbox': {
      const label = (node.props.label as string) ?? ''
      const name = (node.props.name as string) ?? ''
      const required = Boolean(node.props.required)
      const checked = Boolean(node.props.checked)
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      return `${indent}<label class="pf-check"${styleAttr}>
${next}<input type="checkbox"${name ? ` name="${escapeAttr(name)}"` : ''}${required ? ' required' : ''}${checked ? ' checked' : ''} />
${next}<span>${escapeHtml(label)}</span>
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
      const fsSt = typoStyleString(node)
      const fsAttr = fsSt ? ` style="${escapeAttr(fsSt)}"` : ''
      const rows = normalized
        .map(
          (opt, i) =>
            `${next}  <label class="pf-radio-row">
${next}    <input type="radio"${name ? ` name="${escapeAttr(name)}"` : ''} value="${escapeAttr(opt)}"${required && i === 0 ? ' required' : ''} />
${next}    <span>${escapeHtml(opt)}</span>
${next}  </label>`,
        )
        .join('\n')
      return `${indent}<fieldset class="pf-fieldset pf-radio-stack"${fsAttr}>
${label ? `${next}<legend>${escapeHtml(label)}</legend>\n` : ''}${rows}
${indent}</fieldset>`
    }
    case 'Card': {
      const title = (node.props.title as string) ?? ''
      const body = (node.props.body as string) ?? ''
      const footer = (node.props.footer as string) ?? ''
      const showFooter = Boolean(node.props.showFooter)
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      const head = title
        ? `${next}<div class="pf-card__header">\n${next}  <div class="pf-card__title">${escapeHtml(title)}</div>\n${next}</div>\n`
        : ''
      const foot =
        showFooter && footer
          ? `${next}<div class="pf-card__footer">${escapeHtml(footer)}</div>\n`
          : showFooter
            ? `${next}<div class="pf-card__footer"></div>\n`
            : ''
      return `${indent}<article class="pf-card"${styleAttr}>
${head}${next}<div class="pf-card__body">${escapeHtml(body)}</div>
${foot}${indent}</article>`
    }
    case 'NavBar': {
      const brand = (node.props.brand as string) ?? ''
      const linksRaw = node.props.links
      const links: { label: string; href: string }[] = Array.isArray(linksRaw)
        ? (linksRaw as { label: string; href: string }[])
        : []
      const st = typoStyleString(node)
      const styleAttr = st ? ` style="${escapeAttr(st)}"` : ''
      const linkHtml = links
        .map(
          (l) =>
            `${next}  <a href="${escapeAttr(l.href ?? '#')}">${escapeHtml(l.label ?? '')}</a>`,
        )
        .join('\n')
      return `${indent}<header class="pf-navbar"${styleAttr}>
${next}<div class="pf-navbar__brand">${escapeHtml(brand)}</div>
${next}<nav class="pf-navbar__nav" aria-label="Primary">
${linkHtml}
${next}</nav>
${indent}</header>`
    }
    default:
      return `${indent}<div class="pf-empty">Unknown component: ${escapeHtml(node.type)}</div>`
  }
}

function exportNodeSubtree(id: ComponentId, components: Record<string, ComponentNode>, indent: string): string {
  const node = components[id]
  if (!node) return ''

  const childBlocks = node.children.map((cid) => exportNodeSubtree(cid, components, `${indent}  `)).filter(Boolean)

  const childInner = childBlocks.join('\n')
  const layoutStr = styleObjectToString(layoutToStyle(normalizeLayout(node.props.layout)))

  if (node.type === 'Root') {
    const inner = renderInner(node, childInner, indent)
    return wrapStyles(layoutStr, inner, indent)
  }

  const inner = renderInner(node, childInner, indent)
  return wrapStyles(layoutStr, inner, indent)
}

export function buildExportedHtml(
  components: Record<string, ComponentNode>,
  breakpoint: BreakpointId,
): string {
  const widthPx = BREAKPOINT_WIDTH_PX[breakpoint]
  const subtree = exportNodeSubtree(ROOT_ID, components, '')
  const inner = subtree.trim()

  const body = `  <div class="pf-page-body">
    <main class="pf-export-frame" style="width: ${widthPx}px; max-width: 100%;">
${inner
  .split('\n')
  .map((line) => `      ${line}`)
  .join('\n')}
    </main>
  </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Exported page</title>
  <style>
${THEME_CSS
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}
  </style>
</head>
<body>
${body}
</body>
</html>
`
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
