import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface GradientCardProps {
  label: string;
  amount: number;
  stats?: { collection?: number; expenses?: number };
  simple?: { label: string; value: string }[];
}

/* Exact values from mobile BalanceCard.tsx:
   padding: spacing[5]=20px, borderRadius: radius['2xl']=24px
   balanceLabel: fontSize.sm=13px, rgba(255,255,255,0.75)
   balanceAmount: 36px bold white
   iconWrapper: 48×48, borderRadius radius.xl=18px, bg rgba(255,255,255,0.15)
   divider: height 1px, marginBottom spacing[4]=16px, bg rgba(255,255,255,0.2)
   statLabelText: fontSize.xs=11px, rgba(255,255,255,0.7)
   statValue: fontSize.lg=18px, fontWeight.semibold, white
   statDivider: width 1px, height 36px, marginHorizontal spacing[4]=16px, bg rgba(255,255,255,0.2)  */
export function GradientCard({ label, amount, stats, simple }: GradientCardProps) {
  return (
    <div
      className="rounded-[24px] p-5"
      style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</p>
          <p className="text-[36px] font-bold text-white leading-none">
            ₹{Number(amount).toLocaleString('en-IN')}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Wallet size={24} color="rgba(255,255,255,0.9)" />
        </div>
      </div>

      {/* Stats row (when collection/expenses available) */}
      {stats && (
        <>
          <div className="h-px mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div className="flex items-center">
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <ArrowDownCircle size={14} color="rgba(255,255,255,0.7)" />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>Collection</span>
              </div>
              <span className="text-[18px] font-semibold text-white">
                ₹{Number(stats.collection ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-px h-9 mx-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <ArrowUpCircle size={14} color="rgba(255,255,255,0.7)" />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>Expenses</span>
              </div>
              <span className="text-[18px] font-semibold text-white">
                ₹{Number(stats.expenses ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Simple key-value pairs */}
      {simple && simple.length > 0 && (
        <>
          <div className="h-px mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div className="flex items-center gap-0">
            {simple.map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && <div className="w-px h-9 mx-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                  <span className="text-[18px] font-semibold text-white">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
