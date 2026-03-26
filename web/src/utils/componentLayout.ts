import type { CSSProperties } from 'react'

export type LayoutDisplay = 'block' | 'flex' | 'grid'

export type LayoutState = {
  display: LayoutDisplay
  flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  width: { mode: 'auto' | 'px' | '%'; value: string }
  height: { mode: 'auto' | 'px' | '%'; value: string }
  padding: {
    top: string
    right: string
    bottom: string
    left: string
    unit: 'px' | '%'
  }
  margin: {
    top: string
    right: string
    bottom: string
    left: string
    unit: 'px' | '%'
  }
}

export const DEFAULT_LAYOUT: LayoutState = {
  display: 'block',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  width: { mode: 'auto', value: '' },
  height: { mode: 'auto', value: '' },
  padding: { top: '', right: '', bottom: '', left: '', unit: 'px' },
  margin: { top: '', right: '', bottom: '', left: '', unit: 'px' },
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseWH(raw: unknown, fallback: LayoutState['width']): LayoutState['width'] {
  if (!isRecord(raw)) return { ...fallback }
  const mode = raw.mode === 'px' || raw.mode === '%' || raw.mode === 'auto' ? raw.mode : 'auto'
  const value = typeof raw.value === 'string' ? raw.value : raw.value != null ? String(raw.value) : ''
  return { mode, value }
}

function parseSides(raw: unknown, unitFallback: 'px' | '%'): LayoutState['padding'] {
  if (!isRecord(raw)) {
    return { ...DEFAULT_LAYOUT.padding }
  }
  const side = (k: string) => (typeof raw[k] === 'string' ? raw[k] : raw[k] != null ? String(raw[k]) : '')
  return {
    top: side('top'),
    right: side('right'),
    bottom: side('bottom'),
    left: side('left'),
    unit: raw.unit === '%' || raw.unit === 'px' ? raw.unit : unitFallback,
  }
}

function freshDefaultLayout(): LayoutState {
  return {
    ...DEFAULT_LAYOUT,
    width: { ...DEFAULT_LAYOUT.width },
    height: { ...DEFAULT_LAYOUT.height },
    padding: { ...DEFAULT_LAYOUT.padding },
    margin: { ...DEFAULT_LAYOUT.margin },
  }
}

export function normalizeLayout(raw: unknown): LayoutState {
  if (!isRecord(raw)) {
    return freshDefaultLayout()
  }
  const display: LayoutDisplay =
    raw.display === 'flex' || raw.display === 'grid' || raw.display === 'block' ? raw.display : 'block'

  const flexDirection =
    raw.flexDirection === 'row' ||
    raw.flexDirection === 'column' ||
    raw.flexDirection === 'row-reverse' ||
    raw.flexDirection === 'column-reverse'
      ? raw.flexDirection
      : DEFAULT_LAYOUT.flexDirection

  const flexWrap =
    raw.flexWrap === 'nowrap' || raw.flexWrap === 'wrap' || raw.flexWrap === 'wrap-reverse'
      ? raw.flexWrap
      : DEFAULT_LAYOUT.flexWrap

  const justifyOpts = new Set([
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
  ] as const)
  const justifyContent = justifyOpts.has(raw.justifyContent as LayoutState['justifyContent'])
    ? (raw.justifyContent as LayoutState['justifyContent'])
    : DEFAULT_LAYOUT.justifyContent

  const alignOpts = new Set(['flex-start', 'flex-end', 'center', 'stretch', 'baseline'] as const)
  const alignItems = alignOpts.has(raw.alignItems as LayoutState['alignItems'])
    ? (raw.alignItems as LayoutState['alignItems'])
    : DEFAULT_LAYOUT.alignItems

  return {
    display,
    flexDirection,
    flexWrap,
    justifyContent,
    alignItems,
    width: parseWH(raw.width, DEFAULT_LAYOUT.width),
    height: parseWH(raw.height, DEFAULT_LAYOUT.height),
    padding: parseSides(raw.padding, 'px'),
    margin: parseSides(raw.margin, 'px'),
  }
}

function sideToCss(val: string, unit: 'px' | '%'): string | undefined {
  const t = val.trim()
  if (!t) return undefined
  if (t === 'auto') return 'auto'
  const n = Number(t)
  if (!Number.isFinite(n)) return undefined
  return unit === '%' ? `${n}%` : `${n}px`
}

export function layoutToStyle(layout: LayoutState): CSSProperties {
  const style: CSSProperties = {}
  style.display = layout.display

  if (layout.display === 'flex') {
    style.flexDirection = layout.flexDirection
    style.flexWrap = layout.flexWrap
    style.justifyContent = layout.justifyContent
    style.alignItems = layout.alignItems
  }
  if (layout.display === 'grid') {
    style.justifyContent = layout.justifyContent
    style.alignItems = layout.alignItems
  }

  if (layout.width.mode !== 'auto' && layout.width.value.trim() !== '') {
    const v = Number(layout.width.value)
    if (Number.isFinite(v)) {
      style.width = layout.width.mode === 'px' ? `${v}px` : `${v}%`
    }
  }

  if (layout.height.mode !== 'auto' && layout.height.value.trim() !== '') {
    const v = Number(layout.height.value)
    if (Number.isFinite(v)) {
      style.height = layout.height.mode === 'px' ? `${v}px` : `${v}%`
    }
  }

  const pt = sideToCss(layout.padding.top, layout.padding.unit)
  const padR = sideToCss(layout.padding.right, layout.padding.unit)
  const pb = sideToCss(layout.padding.bottom, layout.padding.unit)
  const pl = sideToCss(layout.padding.left, layout.padding.unit)
  if (pt !== undefined) style.paddingTop = pt
  if (padR !== undefined) style.paddingRight = padR
  if (pb !== undefined) style.paddingBottom = pb
  if (pl !== undefined) style.paddingLeft = pl

  const mt = sideToCss(layout.margin.top, layout.margin.unit)
  const mr = sideToCss(layout.margin.right, layout.margin.unit)
  const mb = sideToCss(layout.margin.bottom, layout.margin.unit)
  const ml = sideToCss(layout.margin.left, layout.margin.unit)
  if (mt !== undefined) style.marginTop = mt
  if (mr !== undefined) style.marginRight = mr
  if (mb !== undefined) style.marginBottom = mb
  if (ml !== undefined) style.marginLeft = ml

  return style
}
