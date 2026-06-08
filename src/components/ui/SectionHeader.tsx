/* Exact values from mobile SectionHeader:
   marginBottom: spacing[3]=12px
   title: fontSize.md=16px, fontWeight.semibold
   action: fontSize.sm=13px, fontWeight.medium, theme.primary  */
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
      {action && (
        <button onClick={onAction} className="text-[13px] font-medium text-primary">
          {action}
        </button>
      )}
    </div>
  );
}
