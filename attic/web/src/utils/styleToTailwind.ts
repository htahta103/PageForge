import type { CSSProperties } from 'react'
import { FONT_PRESETS } from './typography'

const WEIGHT_MAP: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
}

const ALIGN_MAP: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

const DISPLAY_MAP: Record<string, string> = {
  block: 'block',
  flex: 'flex',
  grid: 'grid',
}

const FLEX_DIR_MAP: Record<string, string> = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
}

const FLEX_WRAP_MAP: Record<string, string> = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
}

const JUSTIFY_MAP: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
}

const ALIGN_ITEMS_MAP: Record<string, string> = {
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

function presetKeyFromFontFamily(cssFont: string): string | null {
  const t = cssFont.trim()
  for (const p of FONT_PRESETS) {
    if (p.css === t) return p.value
  }
  return null
}

function fontClassFromPresetKey(key: string): string {
  if (key === 'serif') return 'font-serif'
  if (key === 'mono') return 'font-mono'
  return 'font-sans'
}

/** Tailwind arbitrary length: only safe px/% literals from our layout editor. */
function arbitrarySpacing(key: 'p' | 'm', side: string, value: string): string {
  const v = value.trim()
  if (!v || v === 'auto') return ''
  if (/^\d+(\.\d+)?px$/.test(v) || /^\d+(\.\d+)?%$/.test(v)) {
    return `${key}${side}-[${v}]`
  }
  return ''
}

/**
 * Converts a subset of React CSSProperties (from layout + typography) into
 * Tailwind classes plus any properties that must stay inline.
 */
export function cssPropsToTailwind(style: CSSProperties): { classNames: string[]; inline: CSSProperties } {
  const classNames: string[] = []
  const inline: CSSProperties = {}

  for (const [key, val] of Object.entries(style)) {
    if (val === undefined || val === null || val === '') continue

    switch (key) {
      case 'display': {
        const c = DISPLAY_MAP[String(val)]
        if (c) classNames.push(c)
        break
      }
      case 'flexDirection': {
        const c = FLEX_DIR_MAP[String(val)]
        if (c) classNames.push(c)
        break
      }
      case 'flexWrap': {
        const c = FLEX_WRAP_MAP[String(val)]
        if (c) classNames.push(c)
        break
      }
      case 'justifyContent': {
        const c = JUSTIFY_MAP[String(val)]
        if (c) classNames.push(c)
        break
      }
      case 'alignItems': {
        const c = ALIGN_ITEMS_MAP[String(val)]
        if (c) classNames.push(c)
        break
      }
      case 'width': {
        const v = String(val)
        if (/^\d+(\.\d+)?px$/.test(v)) classNames.push(`w-[${v}]`)
        else if (/^\d+(\.\d+)?%$/.test(v)) classNames.push(`w-[${v}]`)
        else inline.width = val as CSSProperties['width']
        break
      }
      case 'height': {
        const v = String(val)
        if (/^\d+(\.\d+)?px$/.test(v)) classNames.push(`h-[${v}]`)
        else if (/^\d+(\.\d+)?%$/.test(v)) classNames.push(`h-[${v}]`)
        else inline.height = val as CSSProperties['height']
        break
      }
      case 'paddingTop': {
        const c = arbitrarySpacing('p', 't', String(val))
        if (c) classNames.push(c)
        else inline.paddingTop = val as CSSProperties['paddingTop']
        break
      }
      case 'paddingRight': {
        const c = arbitrarySpacing('p', 'r', String(val))
        if (c) classNames.push(c)
        else inline.paddingRight = val as CSSProperties['paddingRight']
        break
      }
      case 'paddingBottom': {
        const c = arbitrarySpacing('p', 'b', String(val))
        if (c) classNames.push(c)
        else inline.paddingBottom = val as CSSProperties['paddingBottom']
        break
      }
      case 'paddingLeft': {
        const c = arbitrarySpacing('p', 'l', String(val))
        if (c) classNames.push(c)
        else inline.paddingLeft = val as CSSProperties['paddingLeft']
        break
      }
      case 'marginTop': {
        const c = arbitrarySpacing('m', 't', String(val))
        if (c) classNames.push(c)
        else inline.marginTop = val as CSSProperties['marginTop']
        break
      }
      case 'marginRight': {
        const c = arbitrarySpacing('m', 'r', String(val))
        if (c) classNames.push(c)
        else inline.marginRight = val as CSSProperties['marginRight']
        break
      }
      case 'marginBottom': {
        const c = arbitrarySpacing('m', 'b', String(val))
        if (c) classNames.push(c)
        else inline.marginBottom = val as CSSProperties['marginBottom']
        break
      }
      case 'marginLeft': {
        const c = arbitrarySpacing('m', 'l', String(val))
        if (c) classNames.push(c)
        else inline.marginLeft = val as CSSProperties['marginLeft']
        break
      }
      case 'fontSize': {
        const v = String(val)
        if (/^\d+(\.\d+)?px$/.test(v)) classNames.push(`text-[${v}]`)
        else inline.fontSize = val as CSSProperties['fontSize']
        break
      }
      case 'fontWeight': {
        const w = String(val)
        const tw = WEIGHT_MAP[w]
        if (tw) classNames.push(tw)
        else inline.fontWeight = val as CSSProperties['fontWeight']
        break
      }
      case 'fontFamily': {
        const preset = presetKeyFromFontFamily(String(val))
        if (preset) classNames.push(fontClassFromPresetKey(preset))
        else inline.fontFamily = val as CSSProperties['fontFamily']
        break
      }
      case 'color': {
        const v = String(val).trim()
        if (/^#[0-9a-fA-F]{6}$/.test(v)) classNames.push(`text-[${v}]`)
        else inline.color = val as CSSProperties['color']
        break
      }
      case 'textAlign': {
        const c = ALIGN_MAP[String(val)]
        if (c) classNames.push(c)
        break
      }
      case 'lineHeight': {
        const v = String(val).trim()
        if (v === '1' || v === '1.0') classNames.push('leading-none')
        else if (v === '1.25') classNames.push('leading-tight')
        else if (v === '1.375') classNames.push('leading-snug')
        else if (v === '1.5') classNames.push('leading-normal')
        else if (v === '1.625') classNames.push('leading-relaxed')
        else if (v === '2') classNames.push('leading-loose')
        else if (/^\d+(\.\d+)?$/.test(v)) classNames.push(`leading-[${v}]`)
        else inline.lineHeight = val as CSSProperties['lineHeight']
        break
      }
      default:
        ;(inline as Record<string, unknown>)[key] = val
    }
  }

  return { classNames, inline }
}

export function twMergeQuoted(classNames: string[]): string {
  return classNames.filter(Boolean).join(' ')
}
