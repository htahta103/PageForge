import type { ComponentStyles, ComponentType } from '@/types/api'
import type { MessageKey } from '@/i18n/en'

export interface Registration {
  type: ComponentType
  labelKey: MessageKey
  defaultProps: Record<string, unknown>
  defaultStyles: ComponentStyles
}
