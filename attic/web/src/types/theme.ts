import type { CSSProperties } from 'react'

export interface ThemeFonts {
  heading: string
  body: string
}

/** Mirrors Go model.Project Theme JSON. */
export interface Theme {
  colors: Record<string, string>
  fonts: ThemeFonts
  /** Base spacing unit in px (multipliers use CSS calc). */
  spacing: number
}

export const GO_DEFAULT_THEME: Theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    'neutral-50': '#FAFAFA',
    'neutral-900': '#171717',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  spacing: 4,
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function normalizeTheme(raw: unknown): Theme {
  const baseColors = { ...GO_DEFAULT_THEME.colors }
  let spacing = GO_DEFAULT_THEME.spacing
  let heading = GO_DEFAULT_THEME.fonts.heading
  let body = GO_DEFAULT_THEME.fonts.body

  if (isRecord(raw)) {
    if (isRecord(raw.colors)) {
      for (const [k, v] of Object.entries(raw.colors)) {
        if (typeof v === 'string' && v.trim()) baseColors[k] = v.trim()
      }
    }
    if (typeof raw.spacing === 'number' && Number.isFinite(raw.spacing) && raw.spacing > 0) {
      spacing = raw.spacing
    }
    if (isRecord(raw.fonts)) {
      if (typeof raw.fonts.heading === 'string' && raw.fonts.heading.trim())
        heading = raw.fonts.heading.trim()
      if (typeof raw.fonts.body === 'string' && raw.fonts.body.trim()) body = raw.fonts.body.trim()
    }
  }

  return {
    colors: baseColors,
    fonts: { heading, body },
    spacing,
  }
}

/** Maps palette keys to --pf-color-* for token references like @primary → var(--pf-color-primary). */
export function themeColorTokenVars(theme: Theme): Record<string, string> {
  const T = normalizeTheme(theme)
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(T.colors)) {
    if (!v?.trim()) continue
    out[`--pf-color-${k}`] = v.trim()
  }
  return out
}

/**
 * Full CSS variables for the canvas / export: token vars, semantic aliases used by components,
 * spacing scale, and fonts.
 */
export function themeCssVariables(theme: Theme): Record<string, string> {
  const T = normalizeTheme(theme)
  const c = T.colors
  const tokenVars = themeColorTokenVars(T)

  const primary = c.primary?.trim() || GO_DEFAULT_THEME.colors.primary
  const secondary = c.secondary?.trim() || GO_DEFAULT_THEME.colors.secondary
  const accent = c.accent?.trim() || GO_DEFAULT_THEME.colors.accent
  const neutral50 = c['neutral-50']?.trim() || GO_DEFAULT_THEME.colors['neutral-50']
  const neutral900 = c['neutral-900']?.trim() || GO_DEFAULT_THEME.colors['neutral-900']
  const muted = c.muted?.trim()
  const border = c.border?.trim()
  const card = c.card?.trim()
  const primaryFg = c['primary-foreground']?.trim() ?? '#ffffff'

  return {
    ...tokenVars,
    '--radius-md': '12px',
    '--color-primary': primary,
    '--color-secondary': secondary,
    '--color-accent': accent,
    '--color-bg': neutral50,
    '--color-fg': neutral900,
    '--color-muted': muted || secondary,
    '--color-border': border || '#e5e7eb',
    '--color-card': card || '#ffffff',
    '--color-primary-foreground': primaryFg,
    '--font-heading': T.fonts.heading,
    '--font-body': T.fonts.body,
    '--font-sans': T.fonts.body,
    '--pf-space-unit': `${T.spacing}px`,
    ...Object.fromEntries(
      Array.from({ length: 13 }, (_, n) => [
        `--space-${n}`,
        `calc(var(--pf-space-unit) * ${n})`,
      ]) as [string, string][],
    ),
  }
}

export function themeToInlineStyle(theme: Theme): CSSProperties {
  const vars = themeCssVariables(theme)
  return vars as CSSProperties
}

/** `:root { ... }` block for static HTML export. */
export function themeToRootCssString(theme: Theme): string {
  const vars = themeCssVariables(theme)
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`)
  return `:root {\n${lines.join('\n')}\n}`
}

export function documentedColorTokenKeys(theme: Theme): string[] {
  return Object.keys(normalizeTheme(theme).colors).sort()
}
