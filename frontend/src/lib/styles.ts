import type { Component } from '@/types/api'
import type { CSSProperties } from 'react'

export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

function toReactStyle(styles: Record<string, string> | undefined): CSSProperties | undefined {
  if (!styles) return undefined
  const out: CSSProperties = {}
  for (const [k, v] of Object.entries(styles)) {
    const camel = k.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase())
    ;(out as Record<string, unknown>)[camel] = v
  }
  return out
}

/** Maps API camelCase keys to React inline style object */
export function resolveComponentStyles(
  component: Component,
  bp: Breakpoint,
): CSSProperties | undefined {
  const s = component.styles
  let merged: Record<string, string> = { ...s.base }
  if ((bp === 'tablet' || bp === 'mobile') && s.tablet) {
    merged = { ...merged, ...s.tablet }
  }
  if (bp === 'mobile' && s.mobile) {
    merged = { ...merged, ...s.mobile }
  }
  return toReactStyle(merged)
}
