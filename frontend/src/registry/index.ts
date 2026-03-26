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
  ].filter(Boolean) as Registration[]
}
