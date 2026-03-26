/* eslint-disable react-refresh/only-export-components -- useT is intentionally co-located */
import { createContext, useContext, type ReactNode } from 'react'
import { en, type MessageKey } from './en'

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}

const I18nContext = createContext<typeof en>(en)

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={en}>{children}</I18nContext.Provider>
}

export function useT() {
  const dict = useContext(I18nContext)
  return (key: MessageKey, vars?: Record<string, string | number>) =>
    interpolate(dict[key] ?? key, vars)
}
