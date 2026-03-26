import { NavLink, Outlet } from 'react-router-dom'
import { paths } from '../../routes/paths'

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-md px-3 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]'
            : 'text-[color:var(--color-muted)] hover:bg-black/5 hover:text-[color:var(--color-fg)]',
        ].join(' ')
      }
      end
    >
      {label}
    </NavLink>
  )
}

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <div className="text-base font-semibold">PageForge</div>
            <div className="text-xs text-[color:var(--color-muted)]">
              frontend scaffold
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <NavItem to={paths.home} label="Home" />
            <NavItem to={paths.editor} label="Editor" />
            <NavItem to={paths.settings} label="Settings" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

