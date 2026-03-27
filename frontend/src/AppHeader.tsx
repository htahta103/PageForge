import { Link } from 'react-router-dom'

import { useT } from '@/i18n/context'

export function AppHeader() {
  const t = useT()
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          className="interactive-control rounded-md px-2 py-1 font-semibold text-neutral-900"
          to="/projects"
        >
          {t('app.name')}
        </Link>
      </div>
    </header>
  )
}
