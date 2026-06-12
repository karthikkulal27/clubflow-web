import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths, subMonths } from 'date-fns';
import {
  CheckCircle, Clock, AlertCircle, CreditCard, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { authStore } from '../store/auth.store';
import { getMyPayments, getAllPayments, markPaymentPaid } from '../lib/payments.api';
import { usePayNow } from '../hooks/useRazorpay';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Shared payment row ── */
function PaymentRow({ payment, showName = false, onPay, onMarkPaid, paying, anyPaying, marking }: {
  payment: any;
  showName?: boolean;
  onPay?: () => void;
  onMarkPaid?: () => void;
  paying?: boolean;
  anyPaying?: boolean;
  marking?: boolean;
}) {
  const isPaid = payment.status === 'PAID';
  const isOverdue = payment.status === 'OVERDUE';

  const label = payment.specialCollection
    ? (payment.specialCollection.label ?? payment.specialCollection.name)
    : (payment.month && payment.year
      ? `${MONTHS[payment.month - 1]} ${payment.year}`
      : payment.dueDate ? format(new Date(payment.dueDate), 'MMMM yyyy') : '—');

  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-[#dcfce7]' : isOverdue ? 'bg-[#fee2e2]' : 'bg-[#fef3c7]'}`}>
          {isPaid
            ? <CheckCircle size={12} className="text-[#22c55e]" />
            : isOverdue
              ? <AlertCircle size={12} className="text-[#ef4444]" />
              : <Clock size={12} className="text-[#f59e0b]" />}
        </div>
        <div className="flex-1 min-w-0">
          {showName && <p className="text-[13px] font-semibold text-slate-900 truncate">{payment.member?.name ?? payment.user?.name}</p>}
          <p className="text-[13px] font-medium text-slate-800">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isPaid && payment.paidAt
              ? `Paid ${format(new Date(payment.paidAt), 'dd MMM yyyy')}`
              : payment.dueDate ? `Due ${format(new Date(payment.dueDate), 'dd MMM yyyy')}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-[15px] font-semibold text-slate-900">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
          <Badge label={payment.status} />
        </div>
      </div>
      {/* Member: Pay Now */}
      {onPay && !isPaid && (
        <button onClick={onPay} disabled={anyPaying}
          className="mt-3 w-full flex items-center justify-center gap-1 bg-primary text-white text-[13px] font-semibold rounded-[14px] py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {paying ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Pay Now <ArrowRight size={14} /></>}
        </button>
      )}
      {/* Admin: Mark Paid */}
      {onMarkPaid && !isPaid && (
        <button onClick={onMarkPaid} disabled={marking}
          className="mt-2.5 w-full flex items-center justify-center gap-1 bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] text-[13px] font-semibold rounded-[14px] py-2.5 disabled:opacity-50">
          {marking ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={14} /> Mark as Paid</>}
        </button>
      )}
    </div>
  );
}

/* ── Admin payments ── */
function AdminPayments() {
  const qc = useQueryClient();
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [tab, setTab] = useState<'PENDING' | 'PAID'>('PENDING');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['all-payments', month, year, tab],
    queryFn: () => getAllPayments({ month, year, status: tab }),
  });

  const markPaid = useMutation({
    mutationFn: markPaymentPaid,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-payments'] }),
  });

  const payments = data?.items ?? [];
  const tabTotal = data?.total ?? 0;

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      {/* Header */}
      <div className="pt-2">
        <p className="text-[20px] font-bold text-slate-900">Payments</p>
        <p className="text-[13px] text-slate-400 mt-0.5">{data?.total ?? 0} records this month</p>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[16px] px-4 py-3">
        <button onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <ChevronLeft size={16} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="text-[15px] font-bold text-slate-900">{format(currentDate, 'MMMM yyyy')}</p>
          <p className="text-[11px] text-slate-400">{tabTotal} {tab.toLowerCase()}</p>
        </div>
        <button onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <ChevronRight size={16} className="text-slate-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-[12px]">
        {(['PENDING', 'PAID'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all"
            style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f172a' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
            {t === 'PENDING' ? 'Pending' : 'Paid'}{tab === t && tabTotal > 0 ? ` (${tabTotal})` : ''}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map((n) => <div key={n} className="h-16 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {!isLoading && payments.length > 0 && (
        <Card padding="none" className="px-4">
          {payments.map((p: any) => (
            <PaymentRow
              key={p.id}
              payment={p}
              showName
              onMarkPaid={tab === 'PENDING' ? () => markPaid.mutate(p.id) : undefined}
              marking={markPaid.isPending && markPaid.variables === p.id}
            />
          ))}
        </Card>
      )}

      {!isLoading && payments.length === 0 && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <CreditCard size={40} className="mb-3 opacity-30" />
          <p className="text-[15px] font-medium">No {tab.toLowerCase()} payments</p>
          <p className="text-[13px] mt-1">for {format(currentDate, 'MMMM yyyy')}</p>
        </div>
      )}
    </div>
  );
}

/* ── Member payments ── */
function MemberPayments() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-payments'], queryFn: getMyPayments });
  const pay = usePayNow(() => qc.invalidateQueries({ queryKey: ['my-payments'] }));

  const payments: any[] = Array.isArray(data) ? data : [];
  const regular = payments.filter((p) => !p.specialCollection);
  const special = payments.filter((p) => !!p.specialCollection);
  const pending = payments.filter((p) => p.status !== 'PAID');

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      <div className="pt-2">
        <p className="text-[20px] font-bold text-slate-900">My Payments</p>
        <p className="text-[13px] text-slate-400 mt-0.5">{payments.length} total · {pending.length} pending</p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((n) => <div key={n} className="h-20 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {regular.length > 0 && (
        <section>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Monthly Dues</p>
          <Card padding="none" className="px-4">
            {regular.map((p) => (
              <PaymentRow key={p.id} payment={p}
                onPay={p.status !== 'PAID' ? () => pay.mutate(p.id) : undefined}
                paying={pay.isPending && pay.variables === p.id}
                anyPaying={pay.isPending} />
            ))}
          </Card>
        </section>
      )}

      {special.length > 0 && (
        <section>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Special Collections</p>
          <Card padding="none" className="px-4">
            {special.map((p) => (
              <PaymentRow key={p.id} payment={p}
                onPay={p.status !== 'PAID' ? () => pay.mutate(p.id) : undefined}
                paying={pay.isPending && pay.variables === p.id}
                anyPaying={pay.isPending} />
            ))}
          </Card>
        </section>
      )}

      {payments.length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <CreditCard size={40} className="mb-3 opacity-30" />
          <p className="text-[15px] font-medium">No payment records yet</p>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const user = authStore.getUser();
  return user?.role === 'ADMIN' ? <AdminPayments /> : <MemberPayments />;
}
