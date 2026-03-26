import type { CSSProperties } from 'react'
import type { ComponentId, ComponentNode } from '../types/components'
import { layoutToStyle, normalizeLayout } from './componentLayout'
import { normalizeTypography, typographyToStyle } from './typography'

export const EXPORT_ROOT_ID: ComponentId = 'root'

export function supportsTypography(node: ComponentNode): boolean {
  const t = node.type
  return (
    t === 'Button' ||
    t === 'Text' ||
    t === 'InputText' ||
    t === 'InputEmail' ||
    t === 'InputNumber' ||
    t === 'Textarea' ||
    t === 'Select' ||
    t === 'Checkbox' ||
    t === 'RadioGroup' ||
    t === 'Card' ||
    t === 'NavBar'
  )
}

export function typographyStyleForNode(node: ComponentNode): CSSProperties {
  return typographyToStyle(normalizeTypography(node.props.typography))
}

export function layoutStyleForNode(node: ComponentNode): CSSProperties {
  return layoutToStyle(normalizeLayout(node.props.layout))
}

export function mapExportChildStrings(
  node: ComponentNode,
  indent: string,
  recur: (id: ComponentId, childIndent: string) => string,
): string[] {
  return node.children.map((cid) => recur(cid, `${indent}  `)).filter(Boolean)
}
