import type { ReactNode, CSSProperties } from 'react';

/* Exact values from mobile StatCard:
   card padding: spacing[4]=16px, borderRadius radius.xl=18px, border 1
   icon wrapper: 40×40, borderRadius radius.md=10px
   gap between icon and text: spacing[2]=8px
   value: fontSize matches mobile — using 22px for large numbers, 18px for currency
   label: fontSize.xs=11px, text.secondary=#475569              */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconBgStyle?: CSSProperties;
}

export function StatCard({ label, value, icon, iconBg, iconBgStyle }: StatCardProps) {
  return (
    <div className="flex-1 bg-white rounded-[18px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`} style={iconBgStyle}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[22px] font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}
