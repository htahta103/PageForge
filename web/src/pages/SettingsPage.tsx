import { getApiBaseUrl } from '../lib/api/config'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-[color:var(--color-muted)]">
        Runtime configuration lives in env vars for now.
      </p>

      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
        <div className="text-sm font-medium">API</div>
        <div className="mt-2 text-sm text-[color:var(--color-muted)]">
          Base URL:{' '}
          <code className="font-mono text-[color:var(--color-fg)]">
            {getApiBaseUrl()}
          </code>
        </div>
      </div>
    </div>
  )
}

