import type { ComponentType } from '../types/components'

export interface ComponentDefinition {
  type: ComponentType
  title: string
  icon?: string
}

export const registry: Record<ComponentType, ComponentDefinition> = {}

