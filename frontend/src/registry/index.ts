import type { Registration } from './types'

const registrations: Record<string, Registration> = {}

export function registerComponent(reg: Registration) {
  registrations[reg.type] = reg
}

export function getRegistration(type: string): Registration | undefined {
  return registrations[type]
}

export function listPaletteRegistrations(): Registration[] {
  return [
    registrations.text,
    registrations.image,
    registrations.button,
    registrations.container,
    registrations.input,
    registrations.card,
    registrations.nav,
    registrations.list,
    registrations.icon,
    registrations.divider,
    registrations.spacer,
    registrations.video,
    registrations['custom-html'],
  ].filter(Boolean) as Registration[]
}
