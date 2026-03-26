import type { BreakpointId } from '../types/components'

export const BREAKPOINT_WIDTH_PX: Record<BreakpointId, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
}

export const BREAKPOINT_OPTIONS: { id: BreakpointId; label: string }[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
]
