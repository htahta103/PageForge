export type ComponentId = string

export type BreakpointId = 'base' | 'sm' | 'md' | 'lg' | 'xl'

export type ComponentType = string

export interface ComponentNode {
  id: ComponentId
  type: ComponentType
  props: Record<string, unknown>
  children: ComponentId[]
}

