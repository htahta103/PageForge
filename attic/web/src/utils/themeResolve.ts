import type { SurfaceState } from './componentSurface'
import { normalizeSurface } from './componentSurface'

/** Map @token → var(--pf-color-token). Pass through hex, var(), and css colors. */
export function resolveColorRef(value: string): string {
  const v = value.trim()
  if (v.startsWith('@')) {
    const key = v.slice(1).trim()
    if (key) return `var(--pf-color-${key})`
    return v
  }
  return v
}

/** Apply token resolution to typography / surface color strings for rendering. */
export function resolveSurfaceColorTokens(raw: unknown): SurfaceState {
  const s = normalizeSurface(raw)
  return {
    ...s,
    background: {
      ...s.background,
      color: resolveColorRef(s.background.color),
      gradientFromColor: resolveColorRef(s.background.gradientFromColor),
      gradientToColor: resolveColorRef(s.background.gradientToColor),
    },
    border: {
      ...s.border,
      color: resolveColorRef(s.border.color),
    },
    effects: {
      ...s.effects,
      shadowColor: resolveColorRef(s.effects.shadowColor),
    },
  }
}
