import { Link } from 'react-router-dom'
import { paths } from '../routes/paths'

export function NotFoundPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-sm text-[color:var(--color-muted)]">
        This route hasn&apos;t been stubbed yet.
      </p>
      <Link
        className="inline-flex rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm hover:bg-black/5"
        to={paths.home}
      >
        Go home
      </Link>
    </div>
  )
}

