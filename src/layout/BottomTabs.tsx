import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';

/** Mobile-only fixed bottom tab bar. */
export function BottomTabs() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-muted'
            }`
          }
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
