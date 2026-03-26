import type { CSSProperties } from 'react'
import { resolveColorRef } from './themeResolve'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type TypographyState = {
  fontFamily: string
  fontSize: string
  fontWeight: string
  color: string
  lineHeight: string
  textAlign: TextAlign
}

export const FONT_PRESETS: { label: string; value: string; css: string }[] = [
  { label: 'System UI', value: 'system', css: 'system-ui, -apple-system, sans-serif' },
  { label: 'Serif', value: 'serif', css: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: 'mono', css: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { label: 'Inter stack', value: 'inter', css: 'Inter, system-ui, sans-serif' },
  { label: 'Theme · heading', value: 'theme-heading', css: 'var(--font-heading)' },
  { label: 'Theme · body', value: 'theme-body', css: 'var(--font-body)' },
]

export const DEFAULT_TYPOGRAPHY: TypographyState = {
  fontFamily: 'system',
  fontSize: '16',
  fontWeight: '400',
  color: '#111827',
  lineHeight: '1.5',
  textAlign: 'left',
}

export const TYPOGRAPHY_WEIGHT_OPTIONS = [
  { label: 'Light 300', value: '300' },
  { label: 'Regular 400', value: '400' },
  { label: 'Medium 500', value: '500' },
  { label: 'Semibold 600', value: '600' },
  { label: 'Bold 700', value: '700' },
  { label: 'Heavy 800', value: '800' },
]

const ALIGN_OPTIONS: TextAlign[] = ['left', 'center', 'right', 'justify']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function freshDefaultTypography(): TypographyState {
  return { ...DEFAULT_TYPOGRAPHY }
}

export function normalizeTypography(raw: unknown): TypographyState {
  if (!isRecord(raw)) return freshDefaultTypography()

  const fontFamily =
    typeof raw.fontFamily === 'string' &&
    FONT_PRESETS.some((p) => p.value === raw.fontFamily)
      ? raw.fontFamily
      : DEFAULT_TYPOGRAPHY.fontFamily

  const fontSize =
    typeof raw.fontSize === 'string' && raw.fontSize.trim() !== ''
      ? raw.fontSize.trim()
      : DEFAULT_TYPOGRAPHY.fontSize

  const fw = typeof raw.fontWeight === 'string' ? raw.fontWeight.trim() : ''
  const fontWeight = fw && Number.isFinite(Number(fw)) ? fw : DEFAULT_TYPOGRAPHY.fontWeight

  let color = typeof raw.color === 'string' ? raw.color.trim() : DEFAULT_TYPOGRAPHY.color
  const validHex = /^#[0-9a-fA-F]{3,8}$/i.test(color)
  const tokenRef = /^@[\w-]+$/.test(color)
  const cssColor =
    /^var\(\s*--[\w-]+\s*\)/.test(color) ||
    /^(rgb|hsl|rgba|hsla|oklch)\(/i.test(color)
  if (!validHex && !tokenRef && !cssColor) color = DEFAULT_TYPOGRAPHY.color

  const lineHeight =
    typeof raw.lineHeight === 'string' && raw.lineHeight.trim() !== ''
      ? raw.lineHeight.trim()
      : DEFAULT_TYPOGRAPHY.lineHeight

  const textAlign = ALIGN_OPTIONS.includes(raw.textAlign as TextAlign)
    ? (raw.textAlign as TextAlign)
    : DEFAULT_TYPOGRAPHY.textAlign

  return { fontFamily, fontSize, fontWeight, color, lineHeight, textAlign }
}

export function typographyPresetCss(fontFamilyKey: string): string {
  const preset = FONT_PRESETS.find((p) => p.value === fontFamilyKey)
  return preset?.css ?? FONT_PRESETS[0].css
}

export function typographyToStyle(typography: TypographyState): CSSProperties {
  const T = normalizeTypography(typography)
  const fs = Number(T.fontSize)
  const fw = Number(T.fontWeight)

  const style: CSSProperties = {
    fontFamily: typographyPresetCss(T.fontFamily),
    lineHeight: T.lineHeight,
    color: resolveColorRef(T.color),
    textAlign: T.textAlign,
  }

  if (Number.isFinite(fs) && fs > 0) style.fontSize = `${fs}px`
  if (Number.isFinite(fw)) style.fontWeight = fw

  return style
}
