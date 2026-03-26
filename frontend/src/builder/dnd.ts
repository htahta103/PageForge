import type { ComponentType } from './types'

export const DND_KIND = {
  palette: 'palette',
  dropRoot: 'drop-root',
  dropContainer: 'drop-container',
} as const

export type PaletteDragId = `palette:${ComponentType}`
export type DropId = typeof DND_KIND.dropRoot | `drop-container:${string}`

export function paletteDragId(type: ComponentType): PaletteDragId {
  return `palette:${type}`
}

export function parsePaletteDragId(id: string): ComponentType | null {
  if (!id.startsWith('palette:')) return null
  return id.slice('palette:'.length) as ComponentType
}

export function containerDropId(containerId: string): DropId {
  return `drop-container:${containerId}`
}

export function parseContainerDropId(id: string): string | null {
  if (!id.startsWith('drop-container:')) return null
  return id.slice('drop-container:'.length)
}

