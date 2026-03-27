import { Link } from 'react-router-dom'

import { useT } from '@/i18n/context'
import { ThemeToggle } from '@/ThemeToggle'

export function AppHeader() {
  const t = useT()
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link className="font-semibold text-fg" to="/projects">
          {t('app.name')}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
