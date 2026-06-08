type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

const variants: Record<BadgeVariant, string> = {
  success: 'bg-[#dcfce7] text-[#22c55e]',
  warning: 'bg-[#fef3c7] text-[#f59e0b]',
  danger: 'bg-[#fee2e2] text-[#ef4444]',
  primary: 'bg-[#dbeafe] text-[#2563eb]',
  neutral: 'bg-slate-100 text-slate-500',
};

const statusToVariant: Record<string, BadgeVariant> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  ADMIN: 'primary',
  MEMBER: 'neutral',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant }: BadgeProps) {
  const v = variant ?? statusToVariant[label] ?? 'neutral';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${variants[v]}`}>
      {label}
    </span>
  );
}
