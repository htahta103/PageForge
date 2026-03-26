export type ComponentId = string

/** Design-time preview widths: Desktop 1280, Tablet 768, Mobile 375 */
export type BreakpointId = 'desktop' | 'tablet' | 'mobile'

export type ComponentType = string

/** Tablet/mobile only; desktop base lives in `props`. */
export type BreakpointPropOverrides = Partial<
  Record<Exclude<BreakpointId, 'desktop'>, Record<string, unknown>>
>

export interface ComponentNode {
  id: ComponentId
  type: ComponentType
  props: Record<string, unknown>
  /** Overrides layered on `props` when tablet/mobile breakpoint is active. */
  breakpointOverrides?: BreakpointPropOverrides
  children: ComponentId[]
}

