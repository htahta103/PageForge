import { paths } from '../routes/paths'

export function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <p className="text-sm text-[color:var(--color-muted)]">
        Shell is up. Top-level routes are stubbed.
      </p>

      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
        <div className="text-sm font-medium">Next</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-[color:var(--color-muted)]">
          <li>
            Open <code className="font-mono">Editor</code> at{' '}
            <code className="font-mono">{paths.editor}</code>
          </li>
          <li>
            Configure backend URL via{' '}
            <code className="font-mono">VITE_API_BASE_URL</code>
          </li>
        </ul>
      </div>
    </div>
  )
}

