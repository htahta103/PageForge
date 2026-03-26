import type { ComponentId, ComponentNode } from '../types/components'

const ROOT_ID: ComponentId = 'root'

const defaultRoot: ComponentNode = {
  id: ROOT_ID,
  type: 'Root',
  props: {},
  children: [],
}

type StoredNode = {
  id: string
  type: string
  props?: Record<string, unknown>
  breakpointOverrides?: ComponentNode['breakpointOverrides']
  children?: string[]
}

/** Flat JSON array stored in pages.components (JSONB). */
export function serializeComponentRecord(components: Record<ComponentId, ComponentNode>): StoredNode[] {
  const root = components[ROOT_ID]
  if (!root) return []

  const out: StoredNode[] = []
  const queue: ComponentId[] = [root.id]
  const seen = new Set<ComponentId>()

  while (queue.length > 0) {
    const id = queue.shift()!
    if (seen.has(id)) continue
    const node = components[id]
    if (!node) continue
    seen.add(id)

    const row: StoredNode = {
      id: node.id,
      type: node.type,
      props: node.props,
      children: [...node.children],
    }
    if (node.breakpointOverrides && Object.keys(node.breakpointOverrides).length > 0) {
      row.breakpointOverrides = node.breakpointOverrides
    }
    out.push(row)
    for (const c of node.children) queue.push(c)
  }

  return out
}

export function deserializeToComponentRecord(raw: unknown): Record<ComponentId, ComponentNode> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { [ROOT_ID]: { ...defaultRoot } }
  }

  const record: Record<ComponentId, ComponentNode> = {}

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as StoredNode
    const id = String(o.id ?? '')
    if (!id) continue
    const type = String(o.type ?? 'Text')
    const props =
      o.props && typeof o.props === 'object' && !Array.isArray(o.props)
        ? { ...o.props }
        : {}
    const children = Array.isArray(o.children) ? o.children.map(String) : []
    const node: ComponentNode = {
      id,
      type,
      props,
      children,
    }
    if (o.breakpointOverrides && typeof o.breakpointOverrides === 'object') {
      node.breakpointOverrides = o.breakpointOverrides as ComponentNode['breakpointOverrides']
    }
    record[id] = node
  }

  if (!record[ROOT_ID]) {
    return { [ROOT_ID]: { ...defaultRoot } }
  }

  return record
}

export function slugifyPageName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
