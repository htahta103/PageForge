import { create } from 'zustand'
import { GO_DEFAULT_THEME, normalizeTheme, type Theme } from '../types/theme'
import type { ProjectDetail } from '../lib/api/projectsPages'

export interface ProjectThemeState {
  /** When null, editor is in local sandbox — theme still applies as defaults. */
  projectId: string | null
  theme: Theme
  /** ISO timestamp from API; used for optimistic updates on theme save. */
  projectUpdatedAt: string | null
  /** Called with full project payload from GET /projects/:id */
  hydrateFromApi: (project: ProjectDetail) => void
  resetToDefaults: () => void
  setTheme: (next: Theme) => void
  patchThemeColors: (patch: Record<string, string>) => void
  setFonts: (fonts: Partial<Theme['fonts']>) => void
  setSpacing: (spacing: number) => void
  applyServerProject: (project: ProjectDetail) => void
}

export const useProjectThemeStore = create<ProjectThemeState>((set, get) => ({
  projectId: null,
  theme: normalizeTheme(GO_DEFAULT_THEME),
  projectUpdatedAt: null,

  hydrateFromApi: (project) => {
    set({
      projectId: project.id,
      theme: normalizeTheme(project.theme),
      projectUpdatedAt: project.updatedAt,
    })
  },

  resetToDefaults: () => {
    set({
      projectId: null,
      theme: normalizeTheme(GO_DEFAULT_THEME),
      projectUpdatedAt: null,
    })
  },

  setTheme: (next) => set({ theme: normalizeTheme(next) }),

  patchThemeColors: (patch) => {
    const { theme } = get()
    const nextColors = { ...theme.colors }
    for (const [k, v] of Object.entries(patch)) {
      if (typeof v !== 'string') continue
      const t = v.trim()
      if (t) nextColors[k] = t
      else delete nextColors[k]
    }
    set({
      theme: normalizeTheme({
        colors: nextColors,
        fonts: theme.fonts,
        spacing: theme.spacing,
      }),
    })
  },

  setFonts: (fonts) => {
    const { theme } = get()
    set({
      theme: normalizeTheme({
        ...theme,
        fonts: { ...theme.fonts, ...fonts },
      }),
    })
  },

  setSpacing: (spacing) => {
    if (!Number.isFinite(spacing) || spacing <= 0) return
    const { theme } = get()
    set({ theme: normalizeTheme({ ...theme, spacing }) })
  },

  applyServerProject: (project) => {
    set({
      theme: normalizeTheme(project.theme),
      projectUpdatedAt: project.updatedAt,
    })
  },
}))
