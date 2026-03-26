import type { BreakpointId, ComponentNode } from '../types/components'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Deep-merge plain objects; primitive/array values from overlay replace. */
export function mergePropsDeep(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(overlay)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = mergePropsDeep(out[k] as Record<string, unknown>, v)
    } else {
      out[k] = v
    }
  }
  return out
}

export function resolvePropsForBreakpoint(
  node: ComponentNode,
  bp: BreakpointId,
): Record<string, unknown> {
  if (bp === 'desktop') return { ...node.props }
  const patch = node.breakpointOverrides?.[bp]
  if (!patch || Object.keys(patch).length === 0) return { ...node.props }
  return mergePropsDeep(node.props, patch)
}

export function isPropOverridden(
  node: ComponentNode,
  bp: BreakpointId,
  propKey: string,
): boolean {
  if (bp === 'desktop') return false
  return node.breakpointOverrides?.[bp]?.[propKey] !== undefined
}
