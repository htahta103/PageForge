export type ComponentId = string

/** Design-time preview widths: Desktop 1280, Tablet 768, Mobile 375 */
export type BreakpointId = 'desktop' | 'tablet' | 'mobile'

export type ComponentType = string

export interface ComponentNode {
  id: ComponentId
  type: ComponentType
  props: Record<string, unknown>
  children: ComponentId[]
}

