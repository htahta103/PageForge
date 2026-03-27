import { useEffect, useState } from 'react'

import { useT } from '@/i18n/context'
import {
  getStoredTheme,
  setStoredTheme,
  THEME_STORAGE_KEY,
  type UiTheme,
} from '@/theme'

export function ThemeToggle() {
  const t = useT()
  const [mode, setMode] = useState<UiTheme>(() => getStoredTheme())

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== THEME_STORAGE_KEY) return
      const next: UiTheme = e.newValue === 'light' ? 'light' : 'dark'
      setMode(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function toggle(): void {
    const next: UiTheme = mode === 'dark' ? 'light' : 'dark'
    setStoredTheme(next)
    setMode(next)
  }

  const isLight = mode === 'light'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-fg-muted" id="theme-toggle-label">
        {t('theme.appearance')}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-labelledby="theme-toggle-label"
        className={[
          'relative inline-flex h-7 w-12 shrink-0 rounded-full border border-border transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          isLight ? 'bg-accent/25' : 'bg-muted',
        ].join(' ')}
        onClick={toggle}
      >
        <span
          className={[
            'pointer-events-none inline-block h-6 w-6 translate-y-px rounded-full bg-surface shadow transition-transform',
            isLight ? 'translate-x-[22px]' : 'translate-x-px',
          ].join(' ')}
        />
        <span className="sr-only">
          {isLight ? t('theme.switchToDark') : t('theme.switchToLight')}
        </span>
      </button>
    </div>
  )
}
