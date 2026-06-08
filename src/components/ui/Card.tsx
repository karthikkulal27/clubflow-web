import type { ReactNode } from 'react';

/* Exact values from mobile Card.tsx:
   borderRadius: radius.xl=18px
   borderWidth: 1px
   default padding: spacing[4]=16px
   overflow: hidden                     */
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const padMap = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-[18px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden ${padMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
