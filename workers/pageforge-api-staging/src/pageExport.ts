/** Page export for D1 fallback — mirrors internal/service/export.go output shape. */

import { strToU8, zipSync } from 'fflate'

const VALID_TYPES = new Set([
  'text',
  'image',
  'button',
  'container',
  'input',
  'card',
  'nav',
  'list',
  'icon',
  'divider',
  'spacer',
  'video',
  'custom-html',
])

export interface ExportFile {
  path: string
  content: string
}

export interface ExportResult {
  format: string
  files: ExportFile[]
}

interface ComponentJSON {
  id: string
  type: string
  parentId?: string | null
  children?: string[]
  props?: Record<string, unknown>
  styles: {
    base?: Record<string, unknown>
    tablet?: Record<string, unknown>
    mobile?: Record<string, unknown>
  }
  meta: {
    name?: string
    locked?: boolean | null
    visible?: boolean | null
  }
  order: number
}

interface ComponentNode {
  comp: ComponentJSON
  children: ComponentNode[]
}

export class ExportValidationError extends Error {
  constructor(public readonly message: string) {
    super(message)
    this.name = 'ExportValidationError'
  }
}

function parseComponents(raw: unknown): ComponentJSON[] {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    throw new ExportValidationError('invalid component tree JSON')
  }
  const components = raw as ComponentJSON[]
  const ids = new Set<string>()
  for (let i = 0; i < components.length; i++) {
    const c = components[i]
    if (!c || typeof c !== 'object') {
      throw new ExportValidationError(`component[${i}] is invalid`)
    }
    if (!c.id || typeof c.id !== 'string') {
      throw new ExportValidationError(`component[${i}].id is required`)
    }
    if (ids.has(c.id)) {
      throw new ExportValidationError(`duplicate component id "${c.id}"`)
    }
    ids.add(c.id)
    if (!VALID_TYPES.has(c.type)) {
      throw new ExportValidationError(`invalid component type "${String(c.type)}"`)
    }
    if (!c.styles || typeof c.styles !== 'object') {
      ;(c as ComponentJSON).styles = { base: {}, tablet: {}, mobile: {} }
    }
    if (!c.meta || typeof c.meta !== 'object') {
      ;(c as ComponentJSON).meta = {}
    }
    if (typeof c.order !== 'number') {
      ;(c as ComponentJSON).order = 0
    }
  }
  return components
}

function orderedChildIDs(parent: ComponentJSON, byID: Map<string, ComponentJSON>): string[] {
  if (parent.children && parent.children.length > 0) {
    return parent.children.filter((id) => byID.has(id))
  }
  const ids: string[] = []
  for (const c of byID.values()) {
    if (c.parentId != null && c.parentId === parent.id) {
      ids.push(c.id)
    }
  }
  ids.sort((a, b) => {
    const ca = byID.get(a)!
    const cb = byID.get(b)!
    if (ca.order !== cb.order) return ca.order - cb.order
    return a.localeCompare(b)
  })
  return ids
}

function buildComponentTree(components: ComponentJSON[]): ComponentNode[] {
  const byID = new Map<string, ComponentJSON>()
  for (const c of components) {
    byID.set(c.id, c)
  }

  const rootIDs: string[] = []
  for (const c of components) {
    if (c.parentId == null || c.parentId === '') {
      rootIDs.push(c.id)
    }
  }
  rootIDs.sort((a, b) => {
    const ca = byID.get(a)!
    const cb = byID.get(b)!
    if (ca.order !== cb.order) return ca.order - cb.order
    return a.localeCompare(b)
  })

  const memo = new Map<string, ComponentNode>()
  const visiting = new Set<string>()

  function buildNode(id: string): ComponentNode {
    const hit = memo.get(id)
    if (hit) return hit
    if (visiting.has(id)) {
      throw new ExportValidationError('component tree contains a cycle')
    }
    const c = byID.get(id)
    if (!c) {
      throw new ExportValidationError(`unknown parent/child component id "${id}"`)
    }
    visiting.add(id)
    const n: ComponentNode = { comp: c, children: [] }
    for (const childID of orderedChildIDs(c, byID)) {
      if (!byID.has(childID)) continue
      n.children.push(buildNode(childID))
    }
    visiting.delete(id)
    memo.set(id, n)
    return n
  }

  return rootIDs.map((id) => buildNode(id))
}

function cssPropName(key: string): string {
  if (key.includes('-')) return key
  return key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

function cssValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return String(v)
}

function cssRuleForComponent(id: string, styles: Record<string, unknown>): string {
  const keys = Object.keys(styles).sort()
  let inner = ''
  for (const k of keys) {
    const prop = cssPropName(k)
    inner += `${prop}: ${cssValue(styles[k])};`
  }
  return `[data-pf-id="${id}"] {${inner}}\n`
}

function generateScopedCSS(components: ComponentJSON[]): string {
  const ids = [...new Set(components.map((c) => c.id))].sort()
  const byID = new Map(components.map((c) => [c.id, c]))
  let base = ''
  let tablet = ''
  let mobile = ''

  for (const id of ids) {
    const c = byID.get(id)!
    const visible = c.meta?.visible != null ? Boolean(c.meta.visible) : true
    if (!visible) continue

    const b = c.styles?.base
    const t = c.styles?.tablet
    const m = c.styles?.mobile
    if (b && Object.keys(b).length > 0) base += cssRuleForComponent(id, b)
    if (t && Object.keys(t).length > 0) tablet += cssRuleForComponent(id, t)
    if (m && Object.keys(m).length > 0) mobile += cssRuleForComponent(id, m)
  }

  let out = base
  if (tablet) {
    out += `@media (max-width: 1279px) {\n${tablet}}\n`
  }
  if (mobile) {
    out += `@media (max-width: 767px) {\n${mobile}}\n`
  }
  return out
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function propString(props: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!props) return ''
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(props, k)) {
      const v = props[k]
      if (v === null || v === undefined) return ''
      if (typeof v === 'string') return v
      return String(v)
    }
  }
  return ''
}

function renderNodeHTML(n: ComponentNode): string {
  const visible = n.comp.meta?.visible != null ? Boolean(n.comp.meta.visible) : true
  if (!visible) return ''

  const idAttr = `data-pf-id="${n.comp.id}"`
  const t = n.comp.type
  const props = n.comp.props

  switch (t) {
    case 'text': {
      const txt = propString(props, 'text', 'value', 'content')
      return `<div ${idAttr}>${escapeHtml(txt)}</div>`
    }
    case 'image': {
      const src = propString(props, 'src', 'url')
      const alt = propString(props, 'alt', 'name')
      return `<img ${idAttr} src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`
    }
    case 'button': {
      const label = propString(props, 'text', 'label', 'value')
      return `<button ${idAttr} type="button">${escapeHtml(label)}</button>`
    }
    case 'container':
    case 'card': {
      let inner = ''
      for (const c of n.children) inner += renderNodeHTML(c)
      return `<div ${idAttr}>${inner}</div>`
    }
    case 'input': {
      const placeholder = propString(props, 'placeholder')
      const value = propString(props, 'value')
      if (placeholder !== '') {
        return `<input ${idAttr} placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" />`
      }
      return `<input ${idAttr} value="${escapeHtml(value)}" />`
    }
    case 'nav': {
      let inner = ''
      for (const c of n.children) inner += renderNodeHTML(c)
      return `<nav ${idAttr}>${inner}</nav>`
    }
    case 'list': {
      let inner = ''
      for (const c of n.children) {
        inner += '<li>' + renderNodeHTML(c) + '</li>'
      }
      return `<ul ${idAttr}>${inner}</ul>`
    }
    case 'icon': {
      const name = propString(props, 'name', 'icon', 'value')
      return `<span ${idAttr}>${escapeHtml(name)}</span>`
    }
    case 'divider':
      return `<hr ${idAttr} />`
    case 'spacer':
      return `<div ${idAttr}></div>`
    case 'video': {
      const src = propString(props, 'src', 'url')
      return `<video ${idAttr} controls src="${escapeHtml(src)}"></video>`
    }
    case 'custom-html': {
      const raw = propString(props, 'html', 'content')
      return `<div ${idAttr}>${raw}</div>`
    }
    default:
      return `<div ${idAttr}></div>`
  }
}

function renderNodesHTML(roots: ComponentNode[]): string {
  return roots.map((r) => renderNodeHTML(r)).join('')
}

function renderHTMLDocument(bodyHTML: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
${bodyHTML}
</body>
</html>
`
}

function renderReactIndexTSX(bodyHTML: string): string {
  const quoted = JSON.stringify(bodyHTML)
  return `import React from "react";
import "./styles.css";

const PageExport: React.FC = () => {
  return <div dangerouslySetInnerHTML={{ __html: ${quoted} }} />;
};

export default PageExport;
`
}

export function exportPageFromComponents(
  componentsRaw: unknown,
  format: 'html' | 'react',
): ExportResult {
  const components = parseComponents(componentsRaw)
  const roots = buildComponentTree(components)
  const css = generateScopedCSS(components)
  const bodyHTML = renderNodesHTML(roots)

  if (format === 'html') {
    const htmlDoc = renderHTMLDocument(bodyHTML)
    return {
      format: 'html',
      files: [
        { path: 'index.html', content: htmlDoc },
        { path: 'styles.css', content: css },
      ],
    }
  }

  const indexTSX = renderReactIndexTSX(bodyHTML)
  return {
    format: 'react',
    files: [
      { path: 'index.tsx', content: indexTSX },
      { path: 'styles.css', content: css },
    ],
  }
}

export function exportPageZipFromComponents(componentsRaw: unknown, format: 'html' | 'react'): Uint8Array {
  const res = exportPageFromComponents(componentsRaw, format)
  const entries: Record<string, Uint8Array> = {}
  for (const f of res.files) {
    entries[f.path] = strToU8(f.content)
  }
  return zipSync(entries)
}
