import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';

/** Desktop-only left navigation rail. */
export function Sidebar() {
  return (
    <aside className="hidden shrink-0 border-r border-line bg-surface md:flex md:w-60 md:flex-col">
      {/* Wordmark */}
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-white">
          N
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          NUST<span className="text-accent">·</span>Study
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Primary" className="flex-1 space-y-1 p-3">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg py-2 pr-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-tint text-accent'
                  : 'text-muted hover:bg-paper hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Small accent indicator on the active item */}
                <span
                  aria-hidden
                  className={`h-5 w-0.5 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`}
                />
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer note */}
      <div className="border-t border-line p-4">
        <p className="text-xs leading-relaxed text-muted">
          Local-first · your data stays on this device
        </p>
      </div>
    </aside>
  );
}
