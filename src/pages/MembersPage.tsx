import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Users, UserPlus, Search, X, ChevronRight, UserX, UserCheck, Trash2,
  Phone, Mail, Calendar, Droplets, AlertCircle, Shield, Pencil, CheckCircle, Clock,
} from 'lucide-react';
import {
  getMembers, getMember, createMember, updateMember,
  deactivateMember, activateMember, deleteMember, getMemberPayments,
} from '../lib/members.api';
import { markPaymentPaid } from '../lib/payments.api';
import type { User } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

/* ── helpers ── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const;

const avatarColors = [
  'bg-[#e0e7ff] text-[#4f46e5]', 'bg-[#fce7f3] text-[#db2777]',
  'bg-[#fef3c7] text-[#d97706]', 'bg-[#dcfce7] text-[#16a34a]',
  'bg-[#dbeafe] text-[#2563eb]', 'bg-[#fee2e2] text-[#dc2626]',
  'bg-[#ccfbf1] text-[#0d9488]', 'bg-[#ede9fe] text-[#7c3aed]',
];

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold ${avatarColors[idx]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initials}
    </div>
  );
}

/* ── Add Member Modal ── */
const addSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Enter valid phone'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['MEMBER', 'ADMIN']),
});
type AddForm = z.infer<typeof addSchema>;

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<AddForm>({
    resolver: zodResolver(addSchema), defaultValues: { role: 'MEMBER' },
  });
  const role = watch('role');
  const create = useMutation({
    mutationFn: createMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">Add Member</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => create.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Full Name" placeholder="John Doe" leftIcon={<Users size={16} />} error={errors.name?.message} {...register('name')} />
          <Input label="Phone" type="tel" placeholder="9876543210" leftIcon={<Phone size={16} />} error={errors.phone?.message} {...register('phone')} />
          <Input label="Password" type="password" placeholder="Min 6 characters" error={errors.password?.message} {...register('password')} />
          <div className="flex flex-col" style={{ gap: 8 }}>
            <label className="text-[13px] font-medium text-slate-600">Role</label>
            <div className="flex gap-2">
              {(['MEMBER', 'ADMIN'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setValue('role', r)}
                  className="flex-1 py-3 rounded-[12px] border-[1.5px] text-[13px] font-semibold transition-all"
                  style={{ borderColor: role === r ? '#2563eb' : '#e2e8f0', background: role === r ? '#eff6ff' : '#fff', color: role === r ? '#2563eb' : '#64748b' }}>
                  {r === 'MEMBER' ? '👤 Member' : '🛡️ Admin'}
                </button>
              ))}
            </div>
            {role === 'ADMIN' && (
              <p className="text-[12px] text-[#f59e0b] bg-[#fffbeb] border border-[#fde68a] rounded-[10px] px-3 py-2">
                Admin can manage all members, payments, and club settings.
              </p>
            )}
          </div>
          {create.error && <p className="text-[12px] text-red-500">{(create.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Add Member</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Member Modal ── */
const editSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Enter valid phone'),
  email: z.string().email().or(z.literal('')).optional(),
  role: z.enum(['MEMBER', 'ADMIN']),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().min(10).or(z.literal('')).optional(),
});
type EditForm = z.infer<typeof editSchema>;

function EditMemberModal({ member, onClose }: { member: User; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: member.name, phone: member.phone, email: member.email ?? '', role: member.role, bloodGroup: member.bloodGroup ?? '', emergencyContact: member.emergencyContact ?? '' },
  });
  const role = watch('role');
  const blood = watch('bloodGroup');
  const update = useMutation({
    mutationFn: (d: EditForm) => updateMember(member.id, { name: d.name, phone: d.phone, email: d.email || null, role: d.role, bloodGroup: d.bloodGroup || null, emergencyContact: d.emergencyContact || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['member', member.id] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 pt-6 pb-0 sticky top-0 bg-white">
          <h3 className="text-[18px] font-semibold text-slate-900">Edit {member.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => update.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Full Name" leftIcon={<Users size={16} />} error={errors.name?.message} {...register('name')} />
          <Input label="Phone" type="tel" leftIcon={<Phone size={16} />} error={errors.phone?.message} {...register('phone')} />
          <Input label="Email (optional)" type="email" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
          <div className="flex flex-col" style={{ gap: 8 }}>
            <label className="text-[13px] font-medium text-slate-600">Role</label>
            <div className="flex gap-2">
              {(['MEMBER', 'ADMIN'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setValue('role', r)}
                  className="flex-1 py-3 rounded-[12px] border-[1.5px] text-[13px] font-semibold transition-all"
                  style={{ borderColor: role === r ? '#2563eb' : '#e2e8f0', background: role === r ? '#eff6ff' : '#fff', color: role === r ? '#2563eb' : '#64748b' }}>
                  {r === 'MEMBER' ? '👤 Member' : '🛡️ Admin'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            <label className="text-[13px] font-medium text-slate-600">Blood Group</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => setValue('bloodGroup', blood === bg ? '' : bg)}
                  className="min-w-[48px] px-3 py-2 rounded-[10px] border-[1.5px] text-[12px] font-semibold transition-all"
                  style={{ borderColor: blood === bg ? '#2563eb' : '#e2e8f0', background: blood === bg ? '#eff6ff' : '#fff', color: blood === bg ? '#2563eb' : '#64748b' }}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <Input label="Emergency Contact (optional)" type="tel" leftIcon={<AlertCircle size={16} />} error={errors.emergencyContact?.message} {...register('emergencyContact')} />
          {update.error && <p className="text-[12px] text-red-500">{(update.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Member Detail Drawer ── */
function MemberDetailDrawer({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { data: member, isLoading } = useQuery({ queryKey: ['member', memberId], queryFn: () => getMember(memberId) });
  const { data: payments } = useQuery({ queryKey: ['member-payments', memberId], queryFn: () => getMemberPayments(memberId), enabled: showPayments });

  const deactivate = useMutation({ mutationFn: () => deactivateMember(memberId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['member', memberId] }); } });
  const activate = useMutation({ mutationFn: () => activateMember(memberId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['member', memberId] }); } });
  const remove = useMutation({ mutationFn: () => deleteMember(memberId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); onClose(); } });
  const markPaid = useMutation({
    mutationFn: (paymentId: string) => markPaymentPaid(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member-payments', memberId] });
      qc.invalidateQueries({ queryKey: ['member', memberId] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (!member) return null;

  const completion = (member as any).profileCompletion ?? 0;
  const completionColor = completion === 100 ? '#22c55e' : completion >= 60 ? '#f59e0b' : '#ef4444';
  const paidCount = (member as any).paymentSummary?.paidCount ?? 0;
  const pendingCount = (member as any).paymentSummary?.pendingCount ?? 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-100">
            <p className="text-[17px] font-bold text-slate-900">Member Details</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowEdit(true)} className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center text-primary">
                <Pencil size={14} />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Hero */}
            <div className="flex flex-col items-center gap-2 py-2">
              <Avatar name={member.name} size={68} />
              <p className="text-[18px] font-bold text-slate-900">{member.name}</p>
              <div className="flex gap-2">
                <Badge label={member.role} variant={member.role === 'ADMIN' ? 'primary' : 'neutral'} />
                <Badge label={member.isActive ? 'Active' : 'Inactive'} variant={member.isActive ? 'success' : 'neutral'} />
              </div>
              {completion < 100 && (
                <div className="w-full max-w-[240px] mt-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-slate-500">Profile completion</span>
                    <span className="text-[11px] font-bold" style={{ color: completionColor }}>{completion}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${completion}%`, background: completionColor }} />
                  </div>
                </div>
              )}
            </div>

            {/* Payment summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#dcfce7] rounded-[14px] px-4 py-3 text-center">
                <p className="text-[22px] font-bold text-[#16a34a]">{paidCount}</p>
                <p className="text-[11px] text-[#16a34a] font-medium">Paid</p>
              </div>
              <div className="bg-[#fef3c7] rounded-[14px] px-4 py-3 text-center">
                <p className="text-[22px] font-bold text-[#d97706]">{pendingCount}</p>
                <p className="text-[11px] text-[#d97706] font-medium">Pending</p>
              </div>
            </div>

            {/* Personal details */}
            <div className="bg-white border border-slate-100 rounded-[16px]">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 pt-3 pb-2">Details</p>
              {[
                { icon: <Phone size={13} />, label: 'Phone', value: member.phone },
                member.email ? { icon: <Mail size={13} />, label: 'Email', value: member.email } : null,
                (member as any).dateOfBirth ? { icon: <Calendar size={13} />, label: 'DOB', value: format(new Date((member as any).dateOfBirth), 'd MMM yyyy') } : null,
                (member as any).bloodGroup ? { icon: <Droplets size={13} />, label: 'Blood Group', value: (member as any).bloodGroup } : null,
                (member as any).emergencyContact ? { icon: <AlertCircle size={13} />, label: 'Emergency', value: (member as any).emergencyContact } : null,
                (member as any).joinedAt ? { icon: <Shield size={13} />, label: 'Joined', value: format(new Date((member as any).joinedAt), 'MMM yyyy') } : null,
              ].filter(Boolean).map((row: any, i, arr) => (
                <div key={row.label} className={`flex items-center gap-3 px-4 py-2.5 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <span className="text-slate-400 flex-shrink-0">{row.icon}</span>
                  <span className="text-[11px] text-slate-400 w-20 flex-shrink-0">{row.label}</span>
                  <span className="text-[13px] font-medium text-slate-900 flex-1 truncate">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Payment history toggle */}
            <button onClick={() => setShowPayments((v) => !v)}
              className="flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-[14px] px-4 py-3 text-[13px] font-semibold text-slate-700">
              Payment History
              <ChevronRight size={16} className={`text-slate-400 transition-transform ${showPayments ? 'rotate-90' : ''}`} />
            </button>

            {showPayments && (
              <div className="bg-white border border-slate-100 rounded-[16px] overflow-hidden">
                {!payments ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-[13px] text-slate-400 text-center py-6">No payments</p>
                ) : (
                  <div className="px-4">
                    {payments.slice(0, 20).map((p: any, i: number) => {
                      const isPaid = p.status === 'PAID';
                      const label = p.specialCollection?.label ?? (p.month && p.year ? `${MONTHS[p.month - 1]} ${p.year}` : '—');
                      const isMarkingThisOne = markPaid.isPending && markPaid.variables === p.id;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 py-3 ${i < Math.min(payments.length, 20) - 1 ? 'border-b border-slate-50' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-[#dcfce7]' : 'bg-[#fef3c7]'}`}>
                            {isPaid ? <CheckCircle size={12} className="text-[#22c55e]" /> : <Clock size={12} className="text-[#f59e0b]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-slate-900">{label}</p>
                            <p className={`text-[10px] font-medium ${isPaid ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>{p.status}</p>
                          </div>
                          <p className="text-[13px] font-semibold text-slate-900 mr-1">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                          {!isPaid && (
                            <button
                              onClick={() => markPaid.mutate(p.id)}
                              disabled={markPaid.isPending}
                              className="flex-shrink-0 px-2.5 py-1.5 rounded-[8px] bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] text-[11px] font-semibold disabled:opacity-40"
                            >
                              {isMarkingThisOne ? '…' : 'Mark Paid'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {member.role !== 'ADMIN' && (
              <div className="flex flex-col gap-2 pt-1">
                {member.isActive ? (
                  <button onClick={() => deactivate.mutate()} disabled={deactivate.isPending}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] border-[1.5px] border-[#f59e0b] bg-[#fffbeb] text-[#d97706] text-[13px] font-semibold disabled:opacity-50">
                    <UserX size={16} /> Deactivate Member
                  </button>
                ) : (
                  <button onClick={() => activate.mutate()} disabled={activate.isPending}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] border-[1.5px] border-[#22c55e] bg-[#dcfce7] text-[#16a34a] text-[13px] font-semibold disabled:opacity-50">
                    <UserCheck size={16} /> Reactivate Member
                  </button>
                )}
                {!confirmRemove ? (
                  <button onClick={() => setConfirmRemove(true)}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] border-[1.5px] border-[#ef4444] bg-[#fef2f2] text-[#ef4444] text-[13px] font-semibold">
                    <Trash2 size={16} /> Remove from Club
                  </button>
                ) : (
                  <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[14px] p-3 flex flex-col gap-2">
                    <p className="text-[12px] text-[#dc2626] text-center">This cannot be undone. Remove {member.name}?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmRemove(false)} className="flex-1 py-2 rounded-[10px] bg-slate-100 text-slate-600 text-[13px] font-semibold">Cancel</button>
                      <button onClick={() => remove.mutate()} disabled={remove.isPending}
                        className="flex-1 py-2 rounded-[10px] bg-[#ef4444] text-white text-[13px] font-semibold disabled:opacity-50">
                        {remove.isPending ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showEdit && <EditMemberModal member={member} onClose={() => setShowEdit(false)} />}
    </>
  );
}

/* ── Main Page ── */
export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedSearch = search; // simple — re-fetches on every keystroke (fast for 50 members)

  const { data, isLoading } = useQuery({
    queryKey: ['members', debouncedSearch],
    queryFn: () => getMembers({ search: debouncedSearch || undefined, status: 'all' }),
  });

  const members = data?.items ?? [];
  const active = members.filter((m) => m.isActive);
  const inactive = members.filter((m) => !m.isActive);

  const renderRow = useCallback((m: User, i: number, arr: User[]) => (
    <div key={m.id}
      className={`flex items-center gap-3 py-3 cursor-pointer active:bg-slate-50 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}
      onClick={() => setSelectedId(m.id)}>
      <Avatar name={m.name} size={44} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 truncate">{m.name}</p>
        <p className="text-[11px] text-slate-400">{m.phone}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge label={m.role} variant={m.role === 'ADMIN' ? 'primary' : 'neutral'} />
          {!m.isActive && <Badge label="Inactive" variant="neutral" />}
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </div>
  ), []);

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="text-[20px] font-bold text-slate-900">Members</p>
          <p className="text-[13px] text-slate-400 mt-0.5">{active.length} active · {inactive.length} inactive</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
          <UserPlus size={16} color="white" />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[14px] px-4 py-2.5">
        <Search size={16} className="text-slate-400 flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="flex-1 text-[14px] text-slate-900 outline-none bg-transparent placeholder:text-slate-400"
        />
        {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((n) => <div key={n} className="h-16 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {active.length > 0 && (
        <section>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Active ({active.length})</p>
          <Card padding="none" className="px-4">
            {active.map((m, i) => renderRow(m, i, active))}
          </Card>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Inactive ({inactive.length})</p>
          <Card padding="none" className="px-4 opacity-70">
            {inactive.map((m, i) => renderRow(m, i, inactive))}
          </Card>
        </section>
      )}

      {members.length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="text-[15px] font-medium">{search ? 'No members found' : 'No members yet'}</p>
        </div>
      )}

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
      {selectedId && <MemberDetailDrawer memberId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
