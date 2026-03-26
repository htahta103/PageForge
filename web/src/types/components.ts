export type ComponentId = string

export type BreakpointId = 'base' | 'sm' | 'md' | 'lg' | 'xl'

export type ComponentType = string

export interface GradientStop {
  color: string
  position: number
}

export interface LinearGradient {
  kind: 'linear'
  angle: number
  stops: GradientStop[]
}

export type BackgroundFillMode = 'color' | 'gradient' | 'image'

export interface BackgroundStyle {
  mode: BackgroundFillMode
  color: string
  gradient: LinearGradient
  imageUrl: string
  imageSize: string
  imageRepeat: string
  imagePosition: string
}

export type BorderStyleKind = 'none' | 'solid' | 'dashed' | 'dotted' | 'double'

export interface BorderRadiusCorners {
  tl: number
  tr: number
  br: number
  bl: number
}

export interface BorderStyle {
  width: number
  style: BorderStyleKind
  color: string
  radius: BorderRadiusCorners
}

export interface BoxShadowStyle {
  inset: boolean
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
}

export type OverflowKind = 'visible' | 'hidden' | 'scroll' | 'auto'

export interface EffectsStyle {
  boxShadows: BoxShadowStyle[]
  opacity: number
  overflow: OverflowKind
  cursor: string
}

export interface ComponentStyle {
  background: BackgroundStyle
  border: BorderStyle
  effects: EffectsStyle
}

export interface ComponentNode {
  id: ComponentId
  type: ComponentType
  props: Record<string, unknown>
  children: ComponentId[]
}

