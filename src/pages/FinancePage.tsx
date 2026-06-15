import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths, subMonths } from 'date-fns';
import { Receipt, Trash2, Calendar, TrendingUp, TrendingDown, Wallet, Zap, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Pencil, X } from 'lucide-react';
import { authStore } from '../store/auth.store';
import {
  getExpenses, addExpense, updateExpense, deleteExpense,
  getPaymentStats, getDuesPlans, createDuesPlan, updateDuesPlan, deleteDuesPlan,
  getSpecialCollections, createSpecialCollection, updateSpecialCollection, deleteSpecialCollection,
  type DuesPlan, type SpecialCollection,
} from '../lib/finance.api';
import { getAllPayments, markPaymentPaid } from '../lib/payments.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATEGORIES = ['Equipment', 'Venue', 'Travel', 'Food', 'Maintenance', 'Other'];

const catStyle: Record<string, { bg: string; text: string }> = {
  Equipment:   { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]' },
  Venue:       { bg: 'bg-[#fef3c7]', text: 'text-[#f59e0b]' },
  Travel:      { bg: 'bg-[#dcfce7]', text: 'text-[#22c55e]' },
  Food:        { bg: 'bg-[#fce7f3]', text: 'text-[#db2777]' },
  Maintenance: { bg: 'bg-[#ede9fe]', text: 'text-[#7c3aed]' },
  Other:       { bg: 'bg-slate-100',  text: 'text-slate-600' },
};

/* ── Add Expense Modal ─────────────────────────── */
const expenseSchema = z.object({
  title: z.string().min(2, 'Title required'),
  amount: z.number({ error: 'Enter valid amount' }).min(1, 'Min ₹1'),
  expenseDate: z.string().min(1, 'Select a date'),
  description: z.string().optional(),
  category: z.string().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

function ExpenseModal({
  onClose,
  expenseId,
  defaultValues,
}: {
  onClose: () => void;
  expenseId?: string;
  defaultValues?: Partial<ExpenseForm>;
}) {
  const qc = useQueryClient();
  const isEditing = !!expenseId;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });
  const mutation = useMutation({
    mutationFn: (data: ExpenseForm) => isEditing
      ? updateExpense(expenseId, { ...data, expenseDate: `${data.expenseDate}T00:00:00.000Z` })
      : addExpense({ ...data, expenseDate: `${data.expenseDate}T00:00:00.000Z` }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Title" placeholder="e.g. Ground booking" error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₹)" type="number" placeholder="0" error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })} />
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">Date</label>
              <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 gap-2 focus-within:border-primary transition-colors">
                <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                <input type="date" className="flex-1 text-[15px] text-slate-900 outline-none bg-transparent py-3" {...register('expenseDate')} />
              </div>
              {errors.expenseDate && <p className="text-[11px] text-danger">{errors.expenseDate.message}</p>}
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="text-[13px] font-medium text-slate-600">Category</label>
            <select {...register('category')}
              className="min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 px-4 text-[15px] text-slate-900 bg-white outline-none focus:border-primary">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Reason (optional)" placeholder="Why was this spent?" {...register('description')} />
          {mutation.error && <p className="text-[11px] text-danger">{(mutation.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>{isEditing ? 'Save Changes' : 'Add Expense'}</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Schedule Dues Modal ─────────────────────────── */
const duesSchema = z.object({
  label: z.string().optional(),
  amount: z.number({ error: 'Enter valid amount' }).min(1, 'Min ₹1'),
  fromMonth: z.string().min(1, 'Select start month'),
  toMonth: z.string().min(1, 'Select end month'),
});
type DuesForm = z.infer<typeof duesSchema>;

function ScheduleDuesModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DuesForm>({ resolver: zodResolver(duesSchema) });
  const create = useMutation({
    mutationFn: createDuesPlan,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dues-plans'] }); onClose(); },
  });

  async function onSubmit(data: DuesForm) {
    const [fromYear, fromMon] = data.fromMonth.split('-').map(Number);
    const [toYear, toMon] = data.toMonth.split('-').map(Number);
    const periods: { month: number; year: number }[] = [];
    let y = fromYear, m = fromMon;
    while (y < toYear || (y === toYear && m <= toMon)) {
      periods.push({ month: m, year: y });
      m++; if (m > 12) { m = 1; y++; }
      if (periods.length > 36) break;
    }
    await create.mutateAsync({ label: data.label || undefined, amount: data.amount, periods });
  }

  const now = new Date();
  const minMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">Schedule Dues</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
          <p className="text-[13px] text-slate-500 -mt-1">Generate monthly dues for all club members across a date range.</p>
          <Input label="Label (optional)" placeholder="e.g. Monthly dues 2026" {...register('label')} />
          <Input label="Amount per member (₹)" type="number" placeholder="500" error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">From month</label>
              <input type="month" min={minMonth} className="min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 px-4 text-[15px] text-slate-900 bg-white outline-none focus:border-primary" {...register('fromMonth')} />
              {errors.fromMonth && <p className="text-[11px] text-danger">{errors.fromMonth.message}</p>}
            </div>
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">To month</label>
              <input type="month" min={minMonth} className="min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 px-4 text-[15px] text-slate-900 bg-white outline-none focus:border-primary" {...register('toMonth')} />
              {errors.toMonth && <p className="text-[11px] text-danger">{errors.toMonth.message}</p>}
            </div>
          </div>
          {create.error && <p className="text-[11px] text-danger">{(create.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Schedule Dues</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Special Collection Modal ─────────────────────────── */
const collectionSchema = z.object({
  label: z.string().min(1, 'Name required'),
  amount: z.number({ error: 'Enter valid amount' }).min(1, 'Min ₹1'),
  month: z.string().min(1, 'Select month'),
  dueDate: z.string().min(1, 'Select due date'),
});
type CollectionForm = z.infer<typeof collectionSchema>;

function SpecialCollectionModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CollectionForm>({ resolver: zodResolver(collectionSchema) });
  const create = useMutation({
    mutationFn: createSpecialCollection,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['special-collections'] }); onClose(); },
  });

  async function onSubmit(data: CollectionForm) {
    const [year, month] = data.month.split('-').map(Number);
    await create.mutateAsync({ label: data.label, amount: data.amount, month, year, dueDate: data.dueDate });
  }

  const now = new Date();
  const minMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">Special Collection</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
          <p className="text-[13px] text-slate-500 -mt-1">Charge all members a one-time collection (e.g. tournament fee, kit purchase).</p>
          <Input label="Name" placeholder="e.g. Tournament fee" error={errors.label?.message} {...register('label')} />
          <Input label="Amount per member (₹)" type="number" placeholder="200" error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">Month</label>
              <input type="month" min={minMonth} className="min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 px-4 text-[15px] text-slate-900 bg-white outline-none focus:border-primary" {...register('month')} />
              {errors.month && <p className="text-[11px] text-danger">{errors.month.message}</p>}
            </div>
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">Due date</label>
              <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 gap-2 focus-within:border-primary transition-colors">
                <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                <input type="date" className="flex-1 text-[15px] text-slate-900 outline-none bg-transparent py-3" {...register('dueDate')} />
              </div>
              {errors.dueDate && <p className="text-[11px] text-danger">{errors.dueDate.message}</p>}
            </div>
          </div>
          {create.error && <p className="text-[11px] text-danger">{(create.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Create Collection</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Dues Plan Modal ─────────────────────────── */
const editDuesSchema = z.object({
  label: z.string().optional(),
  amount: z.number({ error: 'Enter valid amount' }).min(1, 'Min ₹1'),
});
type EditDuesForm = z.infer<typeof editDuesSchema>;

function EditDuesPlanModal({ plan, onClose }: { plan: DuesPlan; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditDuesForm>({
    resolver: zodResolver(editDuesSchema),
    defaultValues: { label: plan.label ?? '', amount: Number(plan.amount) },
  });
  const mutation = useMutation({
    mutationFn: (d: EditDuesForm) => updateDuesPlan(plan.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dues-plans'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">Edit Dues Plan</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Label (optional)" placeholder="e.g. Monthly dues 2026" {...register('label')} />
          <Input label="Amount per member (₹)" type="number" error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })} />
          <p className="text-[12px] text-slate-400 -mt-2">Updating the amount will apply to all pending payments in this plan.</p>
          {mutation.error && <p className="text-[11px] text-danger">{(mutation.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Special Collection Modal ─────────────────────────── */
const editCollectionSchema = z.object({
  label: z.string().min(1, 'Name required'),
  amount: z.number({ error: 'Enter valid amount' }).min(1, 'Min ₹1'),
  dueDate: z.string().min(1, 'Select due date'),
});
type EditCollectionForm = z.infer<typeof editCollectionSchema>;

function EditSpecialCollectionModal({ col, onClose }: { col: SpecialCollection; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditCollectionForm>({
    resolver: zodResolver(editCollectionSchema),
    defaultValues: { label: col.label, amount: Number(col.amount), dueDate: col.dueDate.slice(0, 10) },
  });
  const mutation = useMutation({
    mutationFn: (d: EditCollectionForm) => updateSpecialCollection(col.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['special-collections'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">Edit Collection</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Name" error={errors.label?.message} {...register('label')} />
          <Input label="Amount per member (₹)" type="number" error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })} />
          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="text-[13px] font-medium text-slate-600">Due date</label>
            <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 gap-2 focus-within:border-primary transition-colors">
              <Calendar size={15} className="text-slate-400 flex-shrink-0" />
              <input type="date" className="flex-1 text-[15px] text-slate-900 outline-none bg-transparent py-3" {...register('dueDate')} />
            </div>
            {errors.dueDate && <p className="text-[11px] text-danger">{errors.dueDate.message}</p>}
          </div>
          <p className="text-[12px] text-slate-400 -mt-2">Updating amount or due date applies to all pending payments.</p>
          {mutation.error && <p className="text-[11px] text-danger">{(mutation.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────── */
type Modal = 'expense' | 'dues' | 'collection' | null;

export default function FinancePage() {
  const user = authStore.getUser();
  const isAdmin = user?.role === 'ADMIN';
  const [modal, setModal] = useState<Modal>(null);
  const [editingExpense, setEditingExpense] = useState<{ id: string; defaultValues: Partial<ExpenseForm> } | null>(null);
  const [editingPlan, setEditingPlan] = useState<DuesPlan | null>(null);
  const [editingCollection, setEditingCollection] = useState<SpecialCollection | null>(null);
  const qc = useQueryClient();

  // Collections section state
  const now = new Date();
  const [collDate, setCollDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [collTab, setCollTab] = useState<'PENDING' | 'PAID'>('PENDING');
  const collMonth = collDate.getMonth() + 1;
  const collYear = collDate.getFullYear();

  const { data: stats } = useQuery({ queryKey: ['payment-stats'], queryFn: () => getPaymentStats() });
  const { data: expData, isLoading: expLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => getExpenses() });
  const { data: duesPlans } = useQuery({ queryKey: ['dues-plans'], queryFn: getDuesPlans, enabled: isAdmin });
  const { data: specialCollections } = useQuery({ queryKey: ['special-collections'], queryFn: getSpecialCollections, enabled: isAdmin });
  const { data: collData, isLoading: collLoading } = useQuery({
    queryKey: ['all-payments', collMonth, collYear, collTab],
    queryFn: () => getAllPayments({ month: collMonth, year: collYear, status: collTab }),
    enabled: isAdmin,
  });

  const removeExpense = useMutation({ mutationFn: deleteExpense, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) });
  const removePlan = useMutation({ mutationFn: deleteDuesPlan, onSuccess: () => qc.invalidateQueries({ queryKey: ['dues-plans'] }) });
  const removeCollection = useMutation({ mutationFn: deleteSpecialCollection, onSuccess: () => qc.invalidateQueries({ queryKey: ['special-collections'] }) });
  const markPaid = useMutation({
    mutationFn: markPaymentPaid,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-payments'] }); qc.invalidateQueries({ queryKey: ['payment-stats'] }); },
  });

  const expenses = expData?.items ?? [];
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const collectedAmount = Number(stats?.collectedAmount ?? 0);
  const balance = collectedAmount - totalExpenses;
  const collPayments = collData?.items ?? [];
  const collTotal = collData?.total ?? 0;

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-[20px] font-bold text-slate-900">Finance</p>
        <p className="text-[13px] text-slate-400 mt-0.5">
          {stats ? `${MONTHS[stats.month - 1]} ${stats.year}` : 'This month'}
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-[20px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.30)' }}>
        <div className="p-5">
          <p className="text-[12px] font-semibold text-blue-200 mb-1">Available Balance</p>
          <p className="text-[32px] font-bold text-white leading-tight">
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp size={13} color="white" />
              </div>
              <div>
                <p className="text-[10px] text-blue-200">Collected</p>
                <p className="text-[14px] font-bold text-white">₹{collectedAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingDown size={13} color="white" />
              </div>
              <div>
                <p className="text-[10px] text-blue-200">Expenses</p>
                <p className="text-[14px] font-bold text-white">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin action buttons */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Schedule Dues', icon: <Calendar size={16} />, color: '#2563eb', bg: '#eff6ff', action: 'dues' as Modal },
            { label: 'Collection', icon: <Zap size={16} />, color: '#f59e0b', bg: '#fffbeb', action: 'collection' as Modal },
            { label: 'Add Expense', icon: <Receipt size={16} />, color: '#ef4444', bg: '#fef2f2', action: 'expense' as Modal },
          ].map(({ label, icon, color, bg, action }) => (
            <button
              key={action}
              onClick={() => setModal(action)}
              style={{ background: bg, color }}
              className="flex flex-col items-center gap-1.5 rounded-[14px] py-3 px-2 font-semibold text-[11px] transition-opacity active:opacity-70"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: color + '22' }}>
                <span style={{ color }}>{icon}</span>
              </div>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Collections — payments list with mark-as-paid */}
      {isAdmin && (
        <section>
          <SectionHeader title="Collections" />

          {/* Month navigator */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[16px] px-4 py-3 mb-3">
            <button onClick={() => setCollDate((d) => subMonths(d, 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <div className="text-center">
              <p className="text-[15px] font-bold text-slate-900">{format(collDate, 'MMMM yyyy')}</p>
              <p className="text-[11px] text-slate-400">{collTotal} payment{collTotal !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setCollDate((d) => addMonths(d, 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>

          {/* Paid / Pending tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-[12px] mb-3">
            {(['PENDING', 'PAID'] as const).map((t) => (
              <button key={t} onClick={() => setCollTab(t)}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all"
                style={{ background: collTab === t ? '#fff' : 'transparent', color: collTab === t ? '#0f172a' : '#64748b', boxShadow: collTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Payment rows */}
          {collLoading && (
            <div className="flex flex-col gap-2">
              {[1,2,3].map((n) => <div key={n} className="h-14 bg-white rounded-[14px] border border-slate-200 animate-pulse" />)}
            </div>
          )}

          {!collLoading && collPayments.length > 0 && (
            <Card padding="none" className="px-4">
              {collPayments.map((p: any, i: number) => {
                const isPaid = p.status === 'PAID';
                const isOverdue = p.status === 'OVERDUE';
                const memberName = p.member?.name ?? p.user?.name ?? '—';
                const label = p.specialCollection
                  ? (p.specialCollection.label ?? p.specialCollection.name)
                  : (p.month && p.year ? `${MONTHS[p.month - 1]} ${p.year}` : '—');
                return (
                  <div key={p.id} className={`py-3 ${i < collPayments.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-[#dcfce7]' : isOverdue ? 'bg-[#fee2e2]' : 'bg-[#fef3c7]'}`}>
                        {isPaid ? <CheckCircle size={12} className="text-[#22c55e]" /> : isOverdue ? <AlertCircle size={12} className="text-[#ef4444]" /> : <Clock size={12} className="text-[#f59e0b]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{memberName}</p>
                        <p className="text-[11px] text-slate-400">{label}</p>
                      </div>
                      <p className="text-[14px] font-semibold text-slate-900">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => markPaid.mutate(p.id)}
                        disabled={markPaid.isPending && markPaid.variables === p.id}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] text-[12px] font-semibold rounded-[10px] py-2 disabled:opacity-50"
                      >
                        {markPaid.isPending && markPaid.variables === p.id
                          ? <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          : <><CheckCircle size={12} /> Mark as Paid</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </Card>
          )}

          {!collLoading && collPayments.length === 0 && (
            <p className="text-[13px] text-slate-400 text-center py-6">
              No {collTab.toLowerCase()} payments for {format(collDate, 'MMMM yyyy')}
            </p>
          )}
        </section>
      )}

      {/* Dues Plans */}
      {isAdmin && (duesPlans?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Dues Schedules" />
          <div className="flex flex-col gap-3">
            {duesPlans!.map((plan) => (
              <div key={plan.id} className="bg-white rounded-[18px] border border-slate-100 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900">{plan.label ?? 'Dues Plan'}</p>
                  <p className="text-[12px] text-slate-500">
                    ₹{Number(plan.amount).toLocaleString('en-IN')} · {plan.periods.length} month{plan.periods.length !== 1 ? 's' : ''}
                    {plan.periods.length > 0 && ` · ${MONTHS[plan.periods[0].month - 1]} ${plan.periods[0].year}${plan.periods.length > 1 ? ` – ${MONTHS[plan.periods[plan.periods.length - 1].month - 1]} ${plan.periods[plan.periods.length - 1].year}` : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditingPlan(plan)} className="w-7 h-7 rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
                    <Pencil size={12} className="text-primary" />
                  </button>
                  <button onClick={() => removePlan.mutate(plan.id)} className="w-7 h-7 rounded-full bg-[#fee2e2] flex items-center justify-center flex-shrink-0">
                    <Trash2 size={12} className="text-[#ef4444]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Special Collections */}
      {isAdmin && (specialCollections?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Special Collections" />
          <Card padding="none" className="px-4">
            {specialCollections!.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-3 py-3 ${i < specialCollections!.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-[#fffbeb] flex items-center justify-center flex-shrink-0">
                  <Zap size={14} className="text-[#f59e0b]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900 truncate">{c.label}</p>
                  <p className="text-[11px] text-slate-400">{FULL_MONTHS[c.month - 1]} {c.year} · Due {format(new Date(c.dueDate), 'dd MMM')}</p>
                </div>
                <p className="text-[15px] font-semibold text-[#f59e0b]">₹{Number(c.amount).toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditingCollection(c)} className="w-7 h-7 rounded-full bg-[#fffbeb] flex items-center justify-center flex-shrink-0">
                    <Pencil size={12} className="text-[#f59e0b]" />
                  </button>
                  <button onClick={() => removeCollection.mutate(c.id)} className="w-7 h-7 rounded-full bg-[#fee2e2] flex items-center justify-center flex-shrink-0">
                    <Trash2 size={12} className="text-[#ef4444]" />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Expenses */}
      {expLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((n) => <div key={n} className="h-20 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {expenses.length > 0 && (
        <section>
          <SectionHeader title="Expenses" />
          <Card padding="none" className="px-4">
            {expenses.map((e, i) => {
              const cat = e.category ?? 'Other';
              const cs = catStyle[cat] ?? catStyle.Other;
              return (
                <div key={e.id} className={`flex items-start gap-3 py-3 ${i < expenses.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${cs.bg}`}>
                    <Receipt size={18} className={cs.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900">{e.title}</p>
                    {e.category && (
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${cs.bg} ${cs.text}`}>
                        {e.category}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5">{format(new Date(e.expenseDate), 'dd MMM yyyy')}</p>
                    {e.addedBy && <p className="text-[11px] text-slate-400">By {e.addedBy.name}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-[15px] font-bold text-slate-900">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditingExpense({
                          id: e.id,
                          defaultValues: {
                            title: e.title,
                            amount: Number(e.amount),
                            expenseDate: e.expenseDate.slice(0, 10),
                            description: e.description ?? '',
                            category: e.category ?? '',
                          },
                        })} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                          <Pencil size={12} className="text-slate-500" />
                        </button>
                        <button onClick={() => removeExpense.mutate(e.id)} className="w-7 h-7 rounded-full bg-[#fee2e2] flex items-center justify-center">
                          <Trash2 size={12} className="text-[#ef4444]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {expenses.length === 0 && !expLoading && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Wallet size={40} className="mb-3 opacity-30" />
          <p className="text-[15px] font-medium">No expenses recorded yet</p>
          {isAdmin && <p className="text-[13px] mt-1">Tap "Add Expense" above to record one</p>}
        </div>
      )}

      {modal === 'expense' && <ExpenseModal onClose={() => setModal(null)} />}
      {modal === 'dues' && <ScheduleDuesModal onClose={() => setModal(null)} />}
      {modal === 'collection' && <SpecialCollectionModal onClose={() => setModal(null)} />}
      {editingExpense && (
        <ExpenseModal
          expenseId={editingExpense.id}
          defaultValues={editingExpense.defaultValues}
          onClose={() => setEditingExpense(null)}
        />
      )}
      {editingPlan && <EditDuesPlanModal plan={editingPlan} onClose={() => setEditingPlan(null)} />}
      {editingCollection && <EditSpecialCollectionModal col={editingCollection} onClose={() => setEditingCollection(null)} />}
    </div>
  );
}
