import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional right-aligned action, e.g. an "Add" button. */
  action?: ReactNode;
}

/** Page title block: display-font heading, optional subtitle + action, hairline rule. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
