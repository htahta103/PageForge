import type { CSSProperties } from 'react'

export type BackgroundMode = 'none' | 'color' | 'gradient' | 'image'

export type BorderStyleMode = 'none' | 'solid' | 'dashed' | 'dotted' | 'double'

export type SurfaceState = {
  background: {
    mode: BackgroundMode
    color: string
    gradientAngle: string
    gradientFromColor: string
    gradientFromStop: string
    gradientToColor: string
    gradientToStop: string
    imageUrl: string
    imageSize: 'cover' | 'contain' | 'auto'
    imagePosition: string
  }
  border: {
    widthTop: string
    widthRight: string
    widthBottom: string
    widthLeft: string
    color: string
    style: BorderStyleMode
    radiusTL: string
    radiusTR: string
    radiusBR: string
    radiusBL: string
  }
  effects: {
    shadowEnabled: boolean
    shadowX: string
    shadowY: string
    shadowBlur: string
    shadowSpread: string
    shadowColor: string
    opacityPercent: string
    overflow: 'visible' | 'hidden' | 'auto' | 'scroll' | ''
    cursor: 'default' | 'pointer' | 'text' | 'move' | 'not-allowed' | 'grab' | ''
  }
}

export const DEFAULT_SURFACE: SurfaceState = {
  background: {
    mode: 'none',
    color: '#ffffff',
    gradientAngle: '135',
    gradientFromColor: '#6366f1',
    gradientFromStop: '0',
    gradientToColor: '#ec4899',
    gradientToStop: '100',
    imageUrl: '',
    imageSize: 'cover',
    imagePosition: 'center',
  },
  border: {
    widthTop: '',
    widthRight: '',
    widthBottom: '',
    widthLeft: '',
    color: '#e5e7eb',
    style: 'solid',
    radiusTL: '',
    radiusTR: '',
    radiusBR: '',
    radiusBL: '',
  },
  effects: {
    shadowEnabled: false,
    shadowX: '0',
    shadowY: '4',
    shadowBlur: '12',
    shadowSpread: '0',
    shadowColor: 'rgba(0,0,0,0.12)',
    opacityPercent: '',
    overflow: '',
    cursor: '',
  },
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v
  if (v != null && typeof v !== 'object') return String(v)
  return fallback
}

function bgMode(v: unknown): BackgroundMode {
  return v === 'color' || v === 'gradient' || v === 'image' || v === 'none' ? v : 'none'
}

function borderStyle(v: unknown): BorderStyleMode {
  return v === 'solid' ||
    v === 'dashed' ||
    v === 'dotted' ||
    v === 'double' ||
    v === 'none'
    ? v
    : 'solid'
}

function imageSize(v: unknown): SurfaceState['background']['imageSize'] {
  return v === 'contain' || v === 'auto' || v === 'cover' ? v : 'cover'
}

export function normalizeSurface(raw: unknown): SurfaceState {
  if (!isRecord(raw)) {
    return {
      ...DEFAULT_SURFACE,
      background: { ...DEFAULT_SURFACE.background },
      border: { ...DEFAULT_SURFACE.border },
      effects: { ...DEFAULT_SURFACE.effects },
    }
  }
  const bg = isRecord(raw.background) ? raw.background : {}
  const border = isRecord(raw.border) ? raw.border : {}
  const effects = isRecord(raw.effects) ? raw.effects : {}

  return {
    background: {
      mode: bgMode(bg.mode),
      color: str(bg.color, DEFAULT_SURFACE.background.color),
      gradientAngle: str(bg.gradientAngle, DEFAULT_SURFACE.background.gradientAngle),
      gradientFromColor: str(bg.gradientFromColor, DEFAULT_SURFACE.background.gradientFromColor),
      gradientFromStop: str(bg.gradientFromStop, DEFAULT_SURFACE.background.gradientFromStop),
      gradientToColor: str(bg.gradientToColor, DEFAULT_SURFACE.background.gradientToColor),
      gradientToStop: str(bg.gradientToStop, DEFAULT_SURFACE.background.gradientToStop),
      imageUrl: str(bg.imageUrl, ''),
      imageSize: imageSize(bg.imageSize),
      imagePosition: str(bg.imagePosition, DEFAULT_SURFACE.background.imagePosition),
    },
    border: {
      widthTop: str(border.widthTop, ''),
      widthRight: str(border.widthRight, ''),
      widthBottom: str(border.widthBottom, ''),
      widthLeft: str(border.widthLeft, ''),
      color: str(border.color, DEFAULT_SURFACE.border.color),
      style: borderStyle(border.style),
      radiusTL: str(border.radiusTL, ''),
      radiusTR: str(border.radiusTR, ''),
      radiusBR: str(border.radiusBR, ''),
      radiusBL: str(border.radiusBL, ''),
    },
    effects: {
      shadowEnabled: Boolean(effects.shadowEnabled),
      shadowX: str(effects.shadowX, DEFAULT_SURFACE.effects.shadowX),
      shadowY: str(effects.shadowY, DEFAULT_SURFACE.effects.shadowY),
      shadowBlur: str(effects.shadowBlur, DEFAULT_SURFACE.effects.shadowBlur),
      shadowSpread: str(effects.shadowSpread, DEFAULT_SURFACE.effects.shadowSpread),
      shadowColor: str(effects.shadowColor, DEFAULT_SURFACE.effects.shadowColor),
      opacityPercent: str(effects.opacityPercent, ''),
      overflow:
        effects.overflow === 'visible' ||
        effects.overflow === 'hidden' ||
        effects.overflow === 'auto' ||
        effects.overflow === 'scroll'
          ? effects.overflow
          : '',
      cursor:
        effects.cursor === 'default' ||
        effects.cursor === 'pointer' ||
        effects.cursor === 'text' ||
        effects.cursor === 'move' ||
        effects.cursor === 'not-allowed' ||
        effects.cursor === 'grab'
          ? effects.cursor
          : '',
    },
  }
}

function sizePx(val: string): string | undefined {
  const t = val.trim()
  if (!t) return undefined
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return undefined
  return `${n}px`
}

function pctStop(s: string): string {
  const t = s.trim()
  if (!t) return '0%'
  return t.includes('%') ? t : `${t}%`
}

export function surfaceToStyle(surface: SurfaceState): CSSProperties {
  const S = surface
  const style: CSSProperties = {}

  if (S.background.mode === 'color') {
    const c = S.background.color.trim()
    if (c) style.backgroundColor = c
  } else if (S.background.mode === 'gradient') {
    const angle = Number(S.background.gradientAngle)
    const a = Number.isFinite(angle) ? angle : 135
    const c1 = S.background.gradientFromColor.trim()
    const c2 = S.background.gradientToColor.trim()
    if (c1 && c2) {
      const s1 = pctStop(S.background.gradientFromStop)
      const s2 = pctStop(S.background.gradientToStop)
      style.backgroundImage = `linear-gradient(${a}deg, ${c1} ${s1}, ${c2} ${s2})`
    }
  } else if (S.background.mode === 'image') {
    const url = S.background.imageUrl.trim()
    if (url) {
      const safe = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      style.backgroundImage = `url("${safe}")`
      style.backgroundSize = S.background.imageSize
      style.backgroundPosition = S.background.imagePosition.trim() || 'center'
      style.backgroundRepeat = 'no-repeat'
    }
  }

  if (S.border.style !== 'none') {
    const wt = sizePx(S.border.widthTop)
    const wr = sizePx(S.border.widthRight)
    const wb = sizePx(S.border.widthBottom)
    const wl = sizePx(S.border.widthLeft)
    if (wt || wr || wb || wl) {
      if (wt) style.borderTopWidth = wt
      if (wr) style.borderRightWidth = wr
      if (wb) style.borderBottomWidth = wb
      if (wl) style.borderLeftWidth = wl
      style.borderStyle = S.border.style
      const bc = S.border.color.trim()
      if (bc) style.borderColor = bc
    }
  }

  const rtl = sizePx(S.border.radiusTL)
  const rtr = sizePx(S.border.radiusTR)
  const rbr = sizePx(S.border.radiusBR)
  const rbl = sizePx(S.border.radiusBL)
  if (rtl) style.borderTopLeftRadius = rtl
  if (rtr) style.borderTopRightRadius = rtr
  if (rbr) style.borderBottomRightRadius = rbr
  if (rbl) style.borderBottomLeftRadius = rbl

  if (S.effects.shadowEnabled) {
    const x = Number(S.effects.shadowX)
    const y = Number(S.effects.shadowY)
    const blur = Number(S.effects.shadowBlur)
    const spread = Number(S.effects.shadowSpread)
    const ox = Number.isFinite(x) ? x : 0
    const oy = Number.isFinite(y) ? y : 0
    const ob = Number.isFinite(blur) ? blur : 0
    const os = Number.isFinite(spread) ? spread : 0
    const color = S.effects.shadowColor.trim() || 'rgba(0,0,0,0.15)'
    style.boxShadow = `${ox}px ${oy}px ${ob}px ${os}px ${color}`
  }

  const op = S.effects.opacityPercent.trim()
  if (op !== '' && op !== '100') {
    const n = Number(op)
    if (Number.isFinite(n)) style.opacity = Math.min(1, Math.max(0, n / 100))
  }

  if (S.effects.overflow) {
    style.overflow = S.effects.overflow
  }

  if (S.effects.cursor) {
    style.cursor = S.effects.cursor
  }

  return style
}
