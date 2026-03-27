import type { Component } from '@/types/api'

import { collectSubtreeIds } from '@/lib/tree'

/** Selected nodes that are not inside another selected subtree. */
export function topLevelSelection(
  map: Record<string, Component>,
  selectedIds: string[],
): string[] {
  return selectedIds.filter(
    (id) =>
      !selectedIds.some(
        (other) => other !== id && collectSubtreeIds(map, other).has(id),
      ),
  )
}

export function extractSubtrees(
  map: Record<string, Component>,
  rootIds: string[],
): Record<string, Component> {
  const out: Record<string, Component> = {}
  for (const rid of rootIds) {
    for (const id of collectSubtreeIds(map, rid)) {
      const n = map[id]
      if (n) out[id] = { ...n, children: [...n.children] }
    }
  }
  return out
}

export function cloneWithNewIds(
  fragment: Record<string, Component>,
  oldRoots: string[],
): { map: Record<string, Component>; roots: string[] } {
  const idMap = new Map<string, string>()
  for (const id of Object.keys(fragment)) {
    idMap.set(id, crypto.randomUUID())
  }
  const next: Record<string, Component> = {}
  for (const [oldId, node] of Object.entries(fragment)) {
    const nid = idMap.get(oldId)!
    const parentOld = node.parentId
    const parentNew =
      parentOld && idMap.has(parentOld) ? idMap.get(parentOld)! : undefined
    next[nid] = {
      ...node,
      id: nid,
      parentId: parentNew,
      children: node.children.map((c) => idMap.get(c)!),
    }
  }
  const roots = oldRoots.map((r) => idMap.get(r)!)
  return { map: next, roots }
}
