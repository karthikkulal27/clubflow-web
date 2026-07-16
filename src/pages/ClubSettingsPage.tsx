import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Shield, Users, Calendar, Info, Palette, Upload } from 'lucide-react';
import { useDynamicColors } from '../hooks/useDynamicColors';
import { getClub, updateClub, getClubBranding, updateClubBranding, uploadLogo } from '../lib/members.api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Club name required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(hexColorRegex, 'Invalid color format').optional().or(z.literal('')),
  secondaryColor: z.string().regex(hexColorRegex, 'Invalid color format').optional().or(z.literal('')),
  slogan: z.string().optional(),
});
type BrandingFormData = z.infer<typeof brandingSchema>;

export default function ClubSettingsPage() {
  const qc = useQueryClient();
  const { primary } = useDynamicColors();
  const { data: club, isLoading } = useQuery({ queryKey: ['club'], queryFn: getClub });
  const { data: branding, isLoading: brandingLoading } = useQuery({ queryKey: ['clubBranding'], queryFn: getClubBranding });
  const [logoUploading, setLogoUploading] = useState(false);

  const primaryLight = (() => {
    const hex = primary.replace('#', '');
    const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 230);
    const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 230);
    const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 230);
    return `rgb(${r}, ${g}, ${b})`;
  })();

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: club ? { name: club.name, description: club.description ?? '' } : undefined,
  });

  const { register: registerBranding, handleSubmit: formHandleSubmit, formState: { isSubmitting: isBrandingSubmitting, isDirty: isBrandingDirty }, watch, setValue, reset } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: '',
      primaryColor: '#2563eb',
      secondaryColor: '#3b82f6',
      slogan: '',
    },
  });

  // Update form when branding data loads
  useEffect(() => {
    if (branding) {
      const primaryColor = (branding.primaryColor || '#2563eb').toLowerCase();
      const secondaryColor = (branding.secondaryColor || '#3b82f6').toLowerCase();

      console.log('Loading branding data:', { primaryColor, secondaryColor });

      reset({
        logoUrl: branding.logoUrl ?? '',
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        slogan: branding.slogan ?? '',
      });
    }
  }, [branding, reset]);

  const update = useMutation({
    mutationFn: updateClub,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club'] }),
  });

  const updateBranding = useMutation({
    mutationFn: updateClubBranding,
    onSuccess: (data) => {
      console.log('Branding updated:', data);
      // Apply colors immediately
      const primaryColor = data.primaryColor || '#2563eb';
      const secondaryColor = data.secondaryColor || '#3b82f6';

      document.documentElement.style.setProperty('--color-primary', primaryColor);
      document.documentElement.style.setProperty('--color-secondary', secondaryColor);

      // Reset form with new values
      reset({
        logoUrl: data.logoUrl ?? '',
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        slogan: data.slogan ?? '',
      });

      // Invalidate and refetch
      qc.invalidateQueries({ queryKey: ['clubBranding'] });
      qc.refetchQueries({ queryKey: ['clubBranding'] });
    },
    onError: (error: any) => {
      console.error('Branding update error:', error.response?.data ?? error);
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogoUploading(true);
      const url = await uploadLogo(file, branding?.logoUrl);
      // Set the logo URL in form so Save button becomes enabled
      setValue('logoUrl', url, { shouldDirty: true });
    } catch (err: any) {
      alert('Failed to upload logo: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBrandingSubmit = (data: BrandingFormData) => {
    // Only send fields that have valid values
    const payload: any = {};
    if (data.logoUrl) payload.logoUrl = data.logoUrl;
    if (data.primaryColor && hexColorRegex.test(data.primaryColor)) payload.primaryColor = data.primaryColor.toLowerCase();
    if (data.secondaryColor && hexColorRegex.test(data.secondaryColor)) payload.secondaryColor = data.secondaryColor.toLowerCase();
    if (data.slogan) payload.slogan = data.slogan;

    console.log('Submitting branding:', payload);
    return updateBranding.mutateAsync(payload);
  };

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

          {/* Club Branding */}
          {brandingLoading ? (
            <div className="h-48 bg-white rounded-[18px] border border-slate-200 animate-pulse" />
          ) : (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-[12px] bg-[#fce7f3] flex items-center justify-center">
                  <Palette size={18} className="text-[#ec4899]" />
                </div>
                <p className="text-[16px] font-semibold text-slate-900">Club Branding</p>
              </div>
              <form onSubmit={formHandleSubmit(handleBrandingSubmit)} className="flex flex-col gap-4">
                {/* Logo Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-slate-600">Club Logo</label>
                  {branding?.logoUrl && (
                    <div className="mb-3">
                      <img src={branding.logoUrl} alt="Club logo" className="h-24 w-auto rounded-[10px] object-cover border border-slate-200" />
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-[14px] cursor-pointer hover:bg-slate-50">
                    <Upload size={16} className="text-slate-500" />
                    <span className="text-[13px] font-medium text-slate-600">Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-500">Recommended: Square image (200×200px or larger). Will be auto-resized to 512×512px.</p>
                </div>

                {/* Primary Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-slate-600">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={watch('primaryColor') || '#2563eb'}
                      onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className="w-16 h-10 rounded-[8px] cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="#2563eb"
                      value={watch('primaryColor') || ''}
                      onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className="flex-1 rounded-[14px] border-[1.5px] border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-slate-600">Secondary Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={watch('secondaryColor') || '#3b82f6'}
                      onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className="w-16 h-10 rounded-[8px] cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="#3b82f6"
                      value={watch('secondaryColor') || ''}
                      onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className="flex-1 rounded-[14px] border-[1.5px] border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Slogan */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-slate-600">Slogan (Optional)</label>
                  <Input
                    type="text"
                    placeholder="Your club's motto or tagline..."
                    {...registerBranding('slogan')}
                  />
                </div>

                {updateBranding.isError && (
                  <p className="text-[12px] text-red-500">{(updateBranding.error as any)?.response?.data?.message ?? 'Update failed'}</p>
                )}
                {updateBranding.isSuccess && (
                  <p className="text-[12px] text-green-600 bg-[#dcfce7] rounded-[10px] px-3 py-2">Branding updated!</p>
                )}
                <Button type="submit" fullWidth size="lg" loading={isBrandingSubmitting} disabled={!isBrandingDirty && !logoUploading}>
                  Save Branding
                </Button>
              </form>
            </Card>
          )}

          {/* Club stats */}
          {club && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: primaryLight }}>
                  <Info size={18} style={{ color: primary }} />
                </div>
                <p className="text-[16px] font-semibold text-slate-900">Club Overview</p>
              </div>

              {club.description && (
                <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">{club.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-[14px] px-4 py-4 flex flex-col gap-2 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Users size={14} style={{ color: primary }} />
                    <p className="text-[11px] font-medium text-slate-600">Total Members</p>
                  </div>
                  <p className="text-[26px] font-bold text-slate-900">{club._count.memberships}</p>
                </div>
                <div className="rounded-[14px] px-4 py-4 flex flex-col gap-2 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: primary }} />
                    <p className="text-[11px] font-medium text-slate-600">Founded</p>
                  </div>
                  <p className="text-[18px] font-bold text-slate-900">{format(new Date(club.createdAt), 'MMM yyyy')}</p>
                </div>
              </div>

              {club.monthlyFee && (
                <div className="rounded-[14px] px-4 py-4 flex items-center justify-between border-2" style={{ borderColor: primary, backgroundColor: primaryLight }}>
                  <p className="text-[13px] font-semibold text-slate-700">Monthly Fee</p>
                  <p className="text-[20px] font-bold" style={{ color: primary }}>₹{Number(club.monthlyFee).toLocaleString('en-IN')}</p>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
