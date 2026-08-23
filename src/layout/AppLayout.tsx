import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';

/**
 * App shell. Renders the persistent navigation (sidebar on desktop, bottom
 * tabs on mobile) around the routed page content (<Outlet />).
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (desktop uses the sidebar wordmark instead) */}
        <header className="flex h-14 items-center gap-2.5 border-b border-line bg-surface px-4 md:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-white">
            N
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-ink">
            NUST<span className="text-accent">·</span>Study
          </span>
        </header>

        {/* Routed content. Extra bottom padding on mobile clears the tab bar. */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <BottomTabs />
    </div>
  );
}
