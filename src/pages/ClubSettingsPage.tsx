import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Shield, Users, Calendar, Info } from 'lucide-react';
import { getClub, updateClub } from '../lib/members.api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Club name required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ClubSettingsPage() {
  const qc = useQueryClient();
  const { data: club, isLoading } = useQuery({ queryKey: ['club'], queryFn: getClub });

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: club ? { name: club.name, description: club.description ?? '' } : undefined,
  });

  const update = useMutation({
    mutationFn: updateClub,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club'] }),
  });

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      <div className="pt-2">
        <p className="text-[20px] font-bold text-slate-900">Club Settings</p>
        <p className="text-[13px] text-slate-400 mt-0.5">Manage your club information</p>
      </div>

      {isLoading ? (
        <div className="h-48 bg-white rounded-[18px] border border-slate-200 animate-pulse" />
      ) : (
        <>
          {/* Club info form */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <p className="text-[16px] font-semibold text-slate-900">Club Information</p>
            </div>
            <form onSubmit={handleSubmit((d) => update.mutateAsync({ name: d.name, description: d.description || undefined }))}
              className="flex flex-col gap-4">
              <Input label="Club Name" placeholder="Enter club name" leftIcon={<Shield size={16} />}
                error={errors.name?.message} {...register('name')} />
              <div className="flex flex-col" style={{ gap: 6 }}>
                <label className="text-[13px] font-medium text-slate-600">Description (optional)</label>
                <textarea {...register('description')} rows={3}
                  placeholder="A short description of your club…"
                  className="rounded-[14px] border-[1.5px] border-slate-200 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary resize-none" />
              </div>
              {update.isError && (
                <p className="text-[12px] text-red-500">{(update.error as any)?.response?.data?.message ?? 'Update failed'}</p>
              )}
              {update.isSuccess && (
                <p className="text-[12px] text-green-600 bg-[#dcfce7] rounded-[10px] px-3 py-2">Club info updated!</p>
              )}
              <Button type="submit" fullWidth size="lg" loading={isSubmitting} disabled={!isDirty}>
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Club stats */}
          {club && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#f5f3ff] flex items-center justify-center">
                  <Info size={18} className="text-[#7c3aed]" />
                </div>
                <p className="text-[16px] font-semibold text-slate-900">Club Stats</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#eff6ff] rounded-[14px] px-4 py-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <p className="text-[11px] font-medium text-primary">Members</p>
                  </div>
                  <p className="text-[24px] font-bold text-slate-900">{club._count.memberships}</p>
                </div>
                <div className="bg-[#f0fdf4] rounded-[14px] px-4 py-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#16a34a]" />
                    <p className="text-[11px] font-medium text-[#16a34a]">Founded</p>
                  </div>
                  <p className="text-[15px] font-bold text-slate-900">{format(new Date(club.createdAt), 'MMM yyyy')}</p>
                </div>
              </div>
              {club.monthlyFee && (
                <div className="mt-3 bg-[#fef3c7] rounded-[14px] px-4 py-3 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[#d97706]">Monthly Fee</p>
                  <p className="text-[16px] font-bold text-slate-900">₹{Number(club.monthlyFee).toLocaleString('en-IN')}</p>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
