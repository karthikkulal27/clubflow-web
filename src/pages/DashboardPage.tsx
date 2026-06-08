import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar, Megaphone, CheckCircle, Clock,
  TrendingUp, Users, Wallet, ArrowRight, UserCircle, X,
} from 'lucide-react';
import { authStore } from '../store/auth.store';
import { getMemberDashboard, getAdminDashboard } from '../lib/dashboard.api';
import { getProfile } from '../lib/members.api';
import { usePayNow } from '../hooks/useRazorpay';
import { Card } from '../components/ui/Card';
import { GradientCard } from '../components/ui/GradientCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';

/* PaymentStatusCard — exact from mobile PaymentStatusCard.tsx:
   border-[1.5px], padding spacing[4]=16px, borderRadius radius.xl=18px
   month: fontSize.xs=11px fontWeight.semibold
   amount: fontSize['2xl']=24px fontWeight.bold
   status: fontSize.xs=11px fontWeight.medium
   payBtn: px spacing[4]=16px, py spacing[2]+2=10px, borderRadius radius.lg=14px
   payBtnText: fontSize.sm=13px fontWeight.semibold                          */
function PaymentStatusCard({ payment, onPayNow, loading }: {
  payment: { id: string; amount: number; status: string; dueDate?: string | null; month?: number; year?: number; paidAt?: string | null } | null;
  onPayNow: () => void;
  loading: boolean;
}) {
  if (!payment) {
    return (
      <div className="rounded-[18px] border-[1.5px] border-[#bbf7d0] bg-[#dcfce7] p-4 flex items-center gap-3">
        <CheckCircle size={24} className="text-[#22c55e]" />
        <span className="text-[15px] font-semibold text-[#166534]">All dues cleared!</span>
      </div>
    );
  }

  const isPaid = payment.status === 'PAID';
  const isOverdue = payment.status === 'OVERDUE';

  const bg = isPaid ? 'bg-[#dcfce7] border-[#22c55e]' : isOverdue ? 'bg-[#fee2e2] border-[#ef4444]' : 'bg-[#fef3c7] border-[#f59e0b]';
  const monthLabel = payment.month != null && payment.year != null
    ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][payment.month - 1]} ${payment.year} Due`
    : payment.dueDate ? `Due ${format(new Date(payment.dueDate), 'MMM yyyy')}` : 'Due';

  return (
    <div className={`rounded-[18px] border-[1.5px] p-4 ${bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className={`text-[11px] font-semibold ${isPaid ? 'text-[#22c55e]' : isOverdue ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
            {monthLabel}
          </span>
          <span className="text-[24px] font-bold text-slate-900 leading-tight">
            ₹{Number(payment.amount).toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-1">
            {isPaid
              ? <CheckCircle size={14} className="text-[#22c55e]" />
              : <Clock size={14} className={isOverdue ? 'text-[#ef4444]' : 'text-[#f59e0b]'} />
            }
            <span className={`text-[11px] font-medium ${isPaid ? 'text-[#22c55e]' : isOverdue ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
              {isPaid && payment.paidAt
                ? `Paid on ${format(new Date(payment.paidAt), 'dd/MM/yyyy')}`
                : isOverdue ? 'Payment Overdue' : 'Payment Pending'}
            </span>
          </div>
        </div>
        {!isPaid && (
          <button
            onClick={onPayNow}
            disabled={loading}
            className="flex items-center gap-1 bg-primary text-white text-[13px] font-semibold disabled:opacity-50 rounded-[14px] active:opacity-80"
            style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10 }}
          >
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Pay Now <ArrowRight size={14} /></>}
          </button>
        )}
        {isPaid && (
          <div className="w-9 h-9 rounded-full bg-[#22c55e] flex items-center justify-center">
            <CheckCircle size={18} color="white" />
          </div>
        )}
      </div>
    </div>
  );
}

/* Profile completion banner — matches mobile MemberDashboardScreen profileCard */
let nudgeDismissedThisSession = false;

function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const [dismissed, setDismissed] = useState(nudgeDismissedThisSession);

  const pct = profile?.profileCompletion ?? 0;
  if (pct >= 100 || dismissed) return null;

  const color = pct >= 60 ? '#f59e0b' : '#ef4444';
  const bgColor = pct >= 60 ? '#fef3c7' : '#fee2e2';
  const borderColor = pct >= 60 ? '#fde68a' : '#fecaca';

  function dismiss(e: React.MouseEvent) {
    e.stopPropagation();
    nudgeDismissedThisSession = true;
    setDismissed(true);
  }

  return (
    <button
      onClick={() => navigate('/profile')}
      className="w-full text-left rounded-[18px] border-[1.5px] p-4 flex flex-col gap-3 transition-opacity active:opacity-80"
      style={{ background: bgColor, borderColor }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircle size={22} style={{ color }} />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Profile completion</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color }}>{pct}% complete</p>
          </div>
        </div>
        <div
          role="button"
          onClick={dismiss}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10"
        >
          <X size={16} className="text-slate-400" />
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/60">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px] leading-[16px]" style={{ color }}>
        Add your photo, email, date of birth, blood group and emergency contact to reach 100%.
      </p>
    </button>
  );
}

/* Skeleton */
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-24 bg-white rounded-[18px] border border-slate-200 animate-pulse" />
      ))}
    </div>
  );
}

/* Payment history row — exact from mobile MemberDashboardScreen:
   row: gap spacing[3]=12px, py spacing[3]=12px, borderBottom 1 borderSubtle
   dot: 28×28, borderRadius 14 (full)
   payMonth: fontSize.sm=13px fontWeight.medium
   payStatus: fontSize.xs=11px fontWeight.medium
   payAmount: fontSize.base=15px fontWeight.semibold                  */
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function PayHistoryRow({ payment, last }: { payment: any; last?: boolean }) {
  const isPaid = payment.status === 'PAID';
  const label = payment.month && payment.year
    ? `${MONTH_NAMES[payment.month - 1]} ${payment.year}`
    : payment.specialCollection?.name ?? (payment.dueDate ? format(new Date(payment.dueDate), 'MMMM yyyy') : '—');
  return (
    <div className={`flex items-center gap-3 py-3 ${last ? '' : 'border-b border-slate-50'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-[#dcfce7]' : 'bg-[#fef3c7]'}`}>
        {isPaid
          ? <CheckCircle size={12} className="text-[#22c55e]" />
          : <Clock size={12} className="text-[#f59e0b]" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-900">{label}</p>
        <p className={`text-[11px] font-medium ${isPaid ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>{payment.status}</p>
      </div>
      <p className="text-[15px] font-semibold text-slate-900">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
    </div>
  );
}

/* Admin payment row — exact from AdminDashboardScreen:
   row: gap spacing[3]=12px, py spacing[3]=12px, borderBottom 1 borderSubtle
   name: fontSize.sm=13px fontWeight.medium
   date: fontSize.xs=11px
   amount: fontSize.base=15px fontWeight.semibold text-success               */
function AdminPayRow({ payment, last }: { payment: any; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-3 ${last ? '' : 'border-b border-slate-50'}`}>
      <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-primary">
        {payment.user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-900 truncate">{payment.user.name}</p>
        <p className="text-[11px] text-slate-400">
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(payment.month ?? 1) - 1]} {payment.year}
        </p>
      </div>
      <p className="text-[15px] font-semibold text-[#22c55e]">+₹{Number(payment.amount).toLocaleString('en-IN')}</p>
    </div>
  );
}

/* Event card row — exact from AdminDashboardScreen:
   row: gap spacing[3]=12px, alignItems flex-start
   icon: 40×40, borderRadius 10, bg primaryLight
   title: fontSize.base=15px fontWeight.semibold (NOT 13px)
   meta: fontSize.xs=11px                                        */
function EventRow({ event }: { event: any }) {
  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center flex-shrink-0">
          <Calendar size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold text-slate-900">{event.title}</p>
          <p className="text-[11px] text-slate-500">{format(new Date(event.startAt), 'EEE, MMM d · h:mm a')}</p>
          {event.location && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>📍</span>{event.location}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function MemberDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-member'], queryFn: getMemberDashboard });
  const [paySuccess, setPaySuccess] = useState(false);
  const pay = usePayNow(() => setPaySuccess(true));
  const user = authStore.getUser();

  if (isLoading) return <div className="px-5 pt-3 pb-8"><Skeleton /></div>;

  return (
    /* screenPadding=20px, paddingBottom spacing[8]=32px, sections gap sectionGap=24px */
    <div className="px-5 pt-3 pb-8 flex flex-col gap-6">
      {/* Top bar — marginBottom spacing[5]=20px (handled by gap-6), paddingTop spacing[2]=8px */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-[13px] text-slate-500">Hello,</p>
          <p className="text-[20px] font-bold text-slate-900">{user?.name}</p>
        </div>
      </div>

      <ProfileCompletionBanner />

      {paySuccess && (
        <div className="flex items-center gap-2 rounded-[14px] bg-[#dcfce7] border border-[#bbf7d0] px-4 py-3">
          <CheckCircle size={16} className="text-[#16a34a] flex-shrink-0" />
          <p className="text-[13px] font-semibold text-[#166534]">Payment successful! Thank you.</p>
        </div>
      )}

      <PaymentStatusCard
        payment={data?.currentDue ?? null}
        onPayNow={() => data?.currentDue && pay.mutate(data.currentDue.id)}
        loading={pay.isPending}
      />

      {data && (
        <GradientCard
          label="Available Balance"
          amount={data.finance.availableBalance}
          simple={[{ label: 'Total Collected', value: `₹${Number(data.finance.totalCollection).toLocaleString('en-IN')}` }]}
        />
      )}

      {(data?.upcomingEvents?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Upcoming Events" />
          <div className="flex flex-col gap-3">
            {data!.upcomingEvents.map((e) => <EventRow key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {data?.latestAnnouncement && (
        <section>
          <SectionHeader title="Latest Announcement" />
          <Card padding="md">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
                <Megaphone size={18} className="text-[#f59e0b]" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <p className="text-[13px] font-semibold text-slate-900">{data.latestAnnouncement.title}</p>
                <p className="text-[11px] leading-[18px] text-slate-500 line-clamp-2">{data.latestAnnouncement.body}</p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {(data?.myPaymentHistory?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Payment History" />
          <Card padding="none" className="px-4">
            {data!.myPaymentHistory.map((p, i) => (
              <PayHistoryRow key={p.id} payment={p} last={i === data!.myPaymentHistory.length - 1} />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-admin'], queryFn: getAdminDashboard });
  const [paySuccess, setPaySuccess] = useState(false);
  const pay = usePayNow(() => setPaySuccess(true));
  const user = authStore.getUser();

  if (isLoading) return <div className="px-5 pt-3 pb-8"><Skeleton /></div>;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();

  return (
    /* screenPadding=20px, sections gap sectionGap=24px */
    <div className="px-5 pt-3 pb-8 flex flex-col gap-6">
      {/* Top bar — paddingTop spacing[2]=8px, marginBottom spacing[6]=24px (gap-6) */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-[13px] text-slate-500">Good day,</p>
          <p className="text-[20px] font-bold text-slate-900">{user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-primary-light text-[11px] font-semibold text-primary">Admin</span>
        </div>
      </div>

      <ProfileCompletionBanner />

      {paySuccess && (
        <div className="flex items-center gap-2 rounded-[14px] bg-[#dcfce7] border border-[#bbf7d0] px-4 py-3">
          <CheckCircle size={16} className="text-[#16a34a] flex-shrink-0" />
          <p className="text-[13px] font-semibold text-[#166534]">Payment successful! Thank you.</p>
        </div>
      )}

      <PaymentStatusCard
        payment={data?.currentDue ?? null}
        onPayNow={() => data?.currentDue && pay.mutate(data.currentDue.id)}
        loading={pay.isPending}
      />

      {data && (
        <GradientCard
          label="Available Balance"
          amount={data.stats.availableBalance}
          stats={{ collection: data.stats.totalCollection, expenses: data.stats.totalExpenses }}
        />
      )}

      {/* Stat grid — gap spacing[3]=12px, 2 columns */}
      {data && (
        <section>
          <SectionHeader title={`${MONTHS[now.getMonth()]} ${now.getFullYear()}`} />
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Members" value={data.stats.totalMembers} icon={<Users size={18} className="text-primary" />} iconBg="bg-primary-light" />
            <StatCard label="Paid" value={data.stats.paidCount} icon={<TrendingUp size={18} className="text-[#22c55e]" />} iconBg="bg-[#dcfce7]" />
            <StatCard label="Pending" value={data.stats.pendingCount} icon={<Clock size={18} className="text-[#f59e0b]" />} iconBg="bg-[#fef3c7]" />
            <StatCard label="Collected" value={`₹${Number(data.stats.totalCollection).toLocaleString('en-IN')}`} icon={<Wallet size={18} className="text-primary" />} iconBg="bg-primary-light" />
          </div>
        </section>
      )}

      {(data?.upcomingEvents?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Upcoming Events" action="See all" />
          <div className="flex flex-col gap-3">
            {data!.upcomingEvents.map((e) => <EventRow key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {(data?.recentPayments?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Recent Payments" action="See all" />
          <Card padding="none" className="px-4">
            {data!.recentPayments.map((p, i) => (
              <AdminPayRow key={p.id} payment={p} last={i === data!.recentPayments.length - 1} />
            ))}
          </Card>
        </section>
      )}

      {(data?.recentExpenses?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Recent Expenses" />
          <Card padding="none" className="px-4">
            {data!.recentExpenses.map((e, i) => (
              <div key={e.id} className={`flex items-center gap-3 py-3 ${i < data!.recentExpenses.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center flex-shrink-0">
                  <Wallet size={14} className="text-[#ef4444]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{e.title}</p>
                  <p className="text-[11px] text-slate-400">{e.category ?? 'General'}</p>
                </div>
                <p className="text-[15px] font-semibold text-[#ef4444]">-₹{Number(e.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const user = authStore.getUser();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <MemberDashboard />;
}
