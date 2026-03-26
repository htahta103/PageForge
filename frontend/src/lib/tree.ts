import type { Component } from '@/types/api'

export function componentsArrayToRecord(
  list: Component[],
): Record<string, Component> {
  return Object.fromEntries(list.map((c) => [c.id, c]))
}

export function componentsRecordToArray(
  map: Record<string, Component>,
): Component[] {
  return Object.values(map)
}

export function getSortedChildrenIds(
  map: Record<string, Component>,
  parentId: string,
): string[] {
  const p = map[parentId]
  if (!p) return []
  return [...p.children].sort((a, b) => {
    const ca = map[a]
    const cb = map[b]
    if (!ca || !cb) return 0
    return ca.order - cb.order
  })
}

export function getRootIds(map: Record<string, Component>): string[] {
  return Object.values(map)
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id)
}

export function nextOrderForNewChild(
  map: Record<string, Component>,
  parentId: string | null,
): number {
  if (parentId) {
    const p = map[parentId]
    return p ? p.children.length : 0
  }
  const roots = Object.values(map).filter((c) => !c.parentId)
  if (roots.length === 0) return 0
  return Math.max(...roots.map((r) => r.order)) + 1
}

export function collectSubtreeIds(
  map: Record<string, Component>,
  rootId: string,
): Set<string> {
  const acc = new Set<string>()
  const walk = (id: string) => {
    if (acc.has(id)) return
    acc.add(id)
    const n = map[id]
    if (!n) return
    for (const ch of n.children) walk(ch)
  }
  walk(rootId)
  return acc
}

export function findParentId(
  map: Record<string, Component>,
  id: string,
): string | null {
  for (const c of Object.values(map)) {
    if (c.children.includes(id)) return c.id
  }
  return null
}
