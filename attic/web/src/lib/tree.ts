import type { ComponentId, ComponentNode } from '../types/components'

const ROOT_ID: ComponentId = 'root'

export function findParentId(
  components: Record<ComponentId, ComponentNode>,
  childId: ComponentId,
): ComponentId | null {
  for (const [pid, node] of Object.entries(components)) {
    if (node.children.includes(childId)) return pid
  }
  return null
}

export function collectDescendantIds(
  components: Record<ComponentId, ComponentNode>,
  rootId: ComponentId,
): Set<ComponentId> {
  const out = new Set<ComponentId>()
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    if (out.has(id)) continue
    out.add(id)
    for (const c of components[id]?.children ?? []) stack.push(c)
  }
  return out
}

export { ROOT_ID }
