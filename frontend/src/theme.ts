export const THEME_STORAGE_KEY = 'pageforge-ui-theme'

export type UiTheme = 'dark' | 'light'

export function getStoredTheme(): UiTheme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: UiTheme): void {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export function setStoredTheme(theme: UiTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore quota / private mode */
  }
  applyTheme(theme)
}
