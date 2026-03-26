import { Link } from 'react-router-dom'

import { useT } from '@/i18n/context'

export function AppHeader() {
  const t = useT()
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link className="font-semibold text-neutral-900" to="/projects">
          {t('app.name')}
        </Link>
      </div>
    </header>
  )
}
