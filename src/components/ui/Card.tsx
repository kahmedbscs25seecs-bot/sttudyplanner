import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** White surface with a hairline border and a whisper of shadow. */
export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(17,24,32,0.04)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
