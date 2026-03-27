import { useEffect, useRef } from 'react'
import { updateProject } from '../lib/api/projectsPages'
import { useProjectThemeStore } from '../store/useProjectThemeStore'

const inputClass =
  'w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm'
const labelClass = 'text-xs font-medium text-[color:var(--color-fg)]'
const subMuted = 'text-[11px] text-[color:var(--color-muted)]'

const CORE_KEYS = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'neutral-50', label: 'Neutral 50 (background)' },
  { key: 'neutral-900', label: 'Neutral 900 (foreground)' },
] as const

const OPTIONAL_KEYS = [
  { key: 'muted', label: 'Muted text' },
  { key: 'border', label: 'Border' },
  { key: 'card', label: 'Card surface' },
  { key: 'primary-foreground', label: 'On-primary text' },
] as const

export function ThemePanel({ disabled }: { disabled?: boolean }) {
  const projectId = useProjectThemeStore((s) => s.projectId)
  const projectUpdatedAt = useProjectThemeStore((s) => s.projectUpdatedAt)
  const theme = useProjectThemeStore((s) => s.theme)
  const patchThemeColors = useProjectThemeStore((s) => s.patchThemeColors)
  const setFonts = useProjectThemeStore((s) => s.setFonts)
  const setSpacing = useProjectThemeStore((s) => s.setSpacing)
  const applyServerProject = useProjectThemeStore((s) => s.applyServerProject)

  const baselineJson = useRef('')

  useEffect(() => {
    if (!projectId || !projectUpdatedAt) return
    baselineJson.current = JSON.stringify(useProjectThemeStore.getState().theme)
  }, [projectId, projectUpdatedAt])

  useEffect(() => {
    if (!projectId || !projectUpdatedAt) return
    const snap = JSON.stringify(theme)
    if (baselineJson.current === '') {
      baselineJson.current = snap
      return
    }
    if (snap === baselineJson.current) return
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const st = useProjectThemeStore.getState()
          const p = await updateProject(projectId, {
            theme: st.theme,
            baseUpdatedAt: st.projectUpdatedAt ?? undefined,
          })
          applyServerProject(p)
          baselineJson.current = JSON.stringify(p.theme)
        } catch (err) {
          console.error('theme save failed', err)
        }
      })()
    }, 800)
    return () => window.clearTimeout(timer)
  }, [theme, projectId, projectUpdatedAt, applyServerProject])

  if (!projectId) return null

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
      <div>
        <div className={labelClass}>Project theme</div>
        <p className={`mt-1 ${subMuted}`}>
          Colors, fonts, and spacing apply to the canvas and HTML export. Use tokens like @primary in typography and
          surface colors.
        </p>
      </div>

      <fieldset disabled={disabled} className="space-y-2 border-0 p-0">
        <div className={labelClass}>Palette</div>
        <div className="grid gap-2">
          {CORE_KEYS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <span className={`w-28 shrink-0 ${subMuted}`}>{label}</span>
              <input
                aria-label={label}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border border-[color:var(--color-border)] bg-white"
                type="color"
                value={/^#[0-9a-fA-F]{6}$/i.test(theme.colors[key] ?? '') ? (theme.colors[key] as string) : '#888888'}
                onChange={(e) => patchThemeColors({ [key]: e.target.value })}
              />
              <input
                className={inputClass}
                spellCheck={false}
                type="text"
                value={theme.colors[key] ?? ''}
                onChange={(e) => patchThemeColors({ [key]: e.target.value })}
              />
            </label>
          ))}
        </div>

        <div className={`${labelClass} mt-3`}>Optional tokens</div>
        <div className="grid gap-2">
          {OPTIONAL_KEYS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <span className={`w-28 shrink-0 ${subMuted}`}>{label}</span>
              <input
                aria-label={label}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border border-[color:var(--color-border)] bg-white"
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/i.test(theme.colors[key] ?? '') ? (theme.colors[key] as string) : '#888888'
                }
                onChange={(e) => patchThemeColors({ [key]: e.target.value })}
              />
              <input
                className={inputClass}
                spellCheck={false}
                type="text"
                value={theme.colors[key] ?? ''}
                placeholder="auto if empty"
                onChange={(e) => patchThemeColors({ [key]: e.target.value })}
              />
            </label>
          ))}
        </div>

        <div className={`${labelClass} mt-3`}>Font stacks</div>
        <label className="block space-y-1">
          <div className={subMuted}>Heading</div>
          <input
            className={inputClass}
            spellCheck={false}
            type="text"
            value={theme.fonts.heading}
            onChange={(e) => setFonts({ heading: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <div className={subMuted}>Body</div>
          <input
            className={inputClass}
            spellCheck={false}
            type="text"
            value={theme.fonts.body}
            onChange={(e) => setFonts({ body: e.target.value })}
          />
        </label>

        <label className="block space-y-1">
          <div className={subMuted}>Spacing unit (px)</div>
          <input
            className={inputClass}
            min={1}
            max={64}
            type="number"
            value={theme.spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
          />
          <div className={subMuted}>Layout tokens: --space-0 … --space-12 as multiples of this unit.</div>
        </label>
      </fieldset>
    </div>
  )
}
