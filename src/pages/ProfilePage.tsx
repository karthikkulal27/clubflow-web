import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { User, Mail, Calendar, Shield, Phone, Pencil, X, AlertCircle, Droplets, Users, Info, Camera, Lock } from 'lucide-react';
import { getProfile, updateProfile, getClub, uploadAvatar, changePassword } from '../lib/members.api';
import { authStore } from '../store/auth.store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Enter valid phone'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().min(10, 'Enter valid number').or(z.literal('')).optional(),
});
type FormData = z.infer<typeof schema>;

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const avatarColors = [
  'bg-[#e0e7ff] text-[#4f46e5]',
  'bg-[#fce7f3] text-[#db2777]',
  'bg-[#fef3c7] text-[#d97706]',
  'bg-[#dcfce7] text-[#16a34a]',
  'bg-[#dbeafe] text-[#2563eb]',
];

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 rounded-[10px] bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
        <p className="text-[14px] font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const user = authStore.getUser();
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: club } = useQuery({ queryKey: ['club'], queryFn: getClub });

  const update = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditMode(false);
    },
  });

  const changePass = useMutation({
    mutationFn: (data: ChangePasswordFormData) => changePassword(data.oldPassword, data.newPassword),
    onSuccess: () => {
      setShowChangePassword(false);
      passwordForm.reset();
      alert('Password changed successfully');
    },
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file);
      await updateProfile({ avatarUrl: url });
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch {
      // silent — avatar upload is best-effort
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: data ? {
      name: data.name ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toString().slice(0, 10) : '',
      bloodGroup: data.bloodGroup ?? '',
      emergencyContact: data.emergencyContact ?? '',
    } : undefined,
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const watchedBloodGroup = watch('bloodGroup');

  async function onSubmit(formData: FormData) {
    await update.mutateAsync({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      dateOfBirth: formData.dateOfBirth || null,
      bloodGroup: formData.bloodGroup || null,
      emergencyContact: formData.emergencyContact || null,
    });
  }

  if (isLoading) {
    return (
      <div className="px-5 pt-3 pb-8 flex flex-col gap-3">
        {[1, 2, 3].map((n) => <div key={n} className="h-32 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
      </div>
    );
  }

  const completion = data?.profileCompletion ?? 0;
  const completionColor = completion === 100 ? '#22c55e' : completion >= 60 ? '#f59e0b' : '#ef4444';
  const initials = data?.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? 'U';
  const colorIdx = (data?.name.charCodeAt(0) ?? 0) % avatarColors.length;

  return (
    <div className="px-5 py-5 flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold text-slate-900">My Profile</h1>
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: editMode ? '#fee2e2' : '#eff6ff', color: editMode ? '#ef4444' : '#2563eb' }}
        >
          {editMode ? <X size={20} /> : <Pencil size={18} />}
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* Hero card */}
      <div className="bg-white rounded-[20px] border border-slate-100 px-5 py-6 flex flex-col items-center gap-3">
        <div className="relative">
          {data?.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${avatarColors[colorIdx]}`}>
              <span className="text-[24px] font-bold">{initials}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-md disabled:opacity-60"
          >
            {avatarUploading
              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={13} color="white" />}
          </button>
        </div>
        <div className="text-center">
          <p className="text-[20px] font-bold text-slate-900">{data?.name}</p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${isAdmin ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-slate-100 text-slate-500'}`}>
              {isAdmin ? 'Club Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* Completion bar — only show if < 100% */}
        {completion < 100 && (
          <div className="w-full mt-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-slate-500">Profile completion</span>
              <span className="text-[11px] font-bold" style={{ color: completionColor }}>{completion}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${completion}%`, background: completionColor }}
              />
            </div>
          </div>
        )}
      </div>

      {editMode ? (
        /* ── EDIT MODE ─────────────────────────── */
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[18px] border border-slate-200 px-5 py-5 flex flex-col gap-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Basic Info</p>
          <Input label="Full Name" leftIcon={<User size={16} />} error={errors.name?.message} {...register('name')} />
          <Input label="Phone" type="tel" leftIcon={<Phone size={16} />} error={errors.phone?.message} {...register('phone')} />
          <Input label="Email (optional)" type="email" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />

          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-1">Personal Details</p>

          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="text-[13px] font-medium text-slate-600">Date of Birth (optional)</label>
            <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 gap-2 focus-within:border-primary transition-colors">
              <Calendar size={15} className="text-slate-400 ml-1 flex-shrink-0" />
              <input type="date" className="flex-1 text-[15px] text-slate-900 outline-none bg-transparent py-3 pl-1" {...register('dateOfBirth')} />
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: 8 }}>
            <label className="text-[13px] font-medium text-slate-600">Blood Group (optional)</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setValue('bloodGroup', watchedBloodGroup === bg ? '' : bg)}
                  className="min-w-[52px] px-3 py-2 rounded-[10px] border-[1.5px] text-[13px] font-semibold transition-all"
                  style={{
                    borderColor: watchedBloodGroup === bg ? '#2563eb' : '#e2e8f0',
                    background: watchedBloodGroup === bg ? '#eff6ff' : '#fff',
                    color: watchedBloodGroup === bg ? '#2563eb' : '#64748b',
                  }}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <Input label="Emergency Contact (optional)" type="tel" leftIcon={<AlertCircle size={16} />}
            error={errors.emergencyContact?.message} {...register('emergencyContact')} />

          {update.error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-[13px] rounded-[10px] px-3 py-2.5">
              {(update.error as any)?.response?.data?.message ?? 'Update failed'}
            </div>
          )}
          {update.isSuccess && (
            <div className="bg-[#dcfce7] border border-[#bbf7d0] text-[#166534] text-[13px] rounded-[10px] px-3 py-2.5">
              Profile updated!
            </div>
          )}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Save Changes</Button>
        </form>
      ) : (
        /* ── VIEW MODE ─────────────────────────── */
        <>
          <Card padding="none">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 pt-4 pb-2">Personal Details</p>
            <div className="px-4">
              <InfoRow icon={<User size={14} />} label="Full Name" value={data?.name ?? '—'} />
              <InfoRow icon={<Phone size={14} />} label="Phone" value={data?.phone ?? '—'} />
              {data?.email && <InfoRow icon={<Mail size={14} />} label="Email" value={data.email} />}
              {data?.dateOfBirth && (
                <InfoRow icon={<Calendar size={14} />} label="Date of Birth"
                  value={format(new Date(data.dateOfBirth), 'd MMMM yyyy')} />
              )}
              {data?.bloodGroup && (
                <InfoRow icon={<Droplets size={14} />} label="Blood Group" value={data.bloodGroup} />
              )}
              {data?.emergencyContact && (
                <InfoRow icon={<AlertCircle size={14} />} label="Emergency Contact" value={data.emergencyContact} />
              )}
              <InfoRow icon={<Shield size={14} />} label="Role" value={isAdmin ? 'Club Administrator' : 'Club Member'} />
            </div>
          </Card>

          {/* Change Password Card */}
          {!showChangePassword ? (
            <div className="bg-red-50 border border-red-200 rounded-[18px] px-4 py-4 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setShowChangePassword(true)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
                  <Lock size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-red-900">Change Password</p>
                  <p className="text-[12px] text-red-700 mt-0.5">Update your password regularly for better security</p>
                </div>
                <Pencil size={16} className="text-red-500 flex-shrink-0" />
              </div>
            </div>
          ) : (
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-semibold text-slate-900">Change Password</p>
                <button type="button" onClick={() => { setShowChangePassword(false); passwordForm.reset(); }} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={passwordForm.handleSubmit((data) => changePass.mutate(data))} className="flex flex-col gap-3">
                <Input
                  label="Current Password"
                  type="password"
                  leftIcon={<Lock size={16} />}
                  error={passwordForm.formState.errors.oldPassword?.message}
                  {...passwordForm.register('oldPassword')}
                />
                <Input
                  label="New Password"
                  type="password"
                  leftIcon={<Lock size={16} />}
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  leftIcon={<Lock size={16} />}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword')}
                />

                <div className="flex gap-2 pt-2">
                  <Button type="submit" fullWidth loading={changePass.isPending}>
                    Change Password
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => { setShowChangePassword(false); passwordForm.reset(); }} disabled={changePass.isPending}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {club && (
            <Card padding="none">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 pt-4 pb-2">Club Details</p>
              <div className="px-4">
                <InfoRow icon={<Info size={14} />} label="Club Name" value={club.name} />
                {club.description && <InfoRow icon={<Info size={14} />} label="About" value={club.description} />}
                <InfoRow icon={<Users size={14} />} label="Total Members" value={String(club._count.memberships)} />
                {club.monthlyFee && (
                  <InfoRow icon={<Shield size={14} />} label="Monthly Fee" value={`₹${Number(club.monthlyFee).toLocaleString('en-IN')}`} />
                )}
                <InfoRow icon={<Calendar size={14} />} label="Founded"
                  value={format(new Date(club.createdAt), 'MMMM yyyy')} />
              </div>
            </Card>
          )}

          <p className="text-center text-[12px] text-slate-400 pb-2">ClubFlow v1.0.0</p>
        </>
      )}
    </div>
  );
}
