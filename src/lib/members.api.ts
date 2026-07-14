import { api } from './api';
import { supabase } from './supabase';
import type { ApiResponse, User, PaginatedResponse } from '../types';

export async function getMembers(params?: { search?: string; status?: 'active' | 'inactive' | 'all'; page?: number }): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<{ success: boolean; data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>('/members', {
    params: { page: params?.page ?? 1, limit: 50, search: params?.search, status: params?.status ?? 'all' },
  });
  const members = (data.data ?? []).map((m: any) => ({ ...m, id: m.userId ?? m.id }));
  return { items: members, total: data.meta?.total ?? 0, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 50, totalPages: data.meta?.totalPages ?? 1 };
}

export async function getMember(userId: string): Promise<User> {
  const { data } = await api.get<ApiResponse<any>>(`/members/${userId}`);
  const m = data.data;
  return { ...m, id: m.userId ?? m.id };
}

export async function createMember(payload: {
  name: string; phone: string; password: string; role: 'ADMIN' | 'MEMBER';
}): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/members', payload);
  return data.data;
}

export async function updateMember(userId: string, payload: Partial<{
  name: string; phone: string; email: string | null; role: 'ADMIN' | 'MEMBER';
  dateOfBirth: string | null; bloodGroup: string | null; emergencyContact: string | null;
  password: string;
}>): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>(`/members/${userId}`, payload);
  return data.data;
}

export async function deactivateMember(id: string): Promise<void> {
  await api.patch(`/members/${id}/deactivate`);
}

export async function activateMember(id: string): Promise<void> {
  await api.patch(`/members/${id}/reactivate`);
}

export async function deleteMember(id: string): Promise<void> {
  await api.delete(`/members/${id}`);
}

export async function getMemberPayments(userId: string): Promise<any[]> {
  const { data } = await api.get<ApiResponse<any[]>>(`/members/${userId}/payments`);
  return data.data;
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<ApiResponse<any>>('/members/me');
  const m = data.data;
  return { ...m, id: m.userId ?? m.id };
}

export async function updateProfile(payload: Partial<{
  name: string; phone: string; email: string | null; avatarUrl: string | null;
  dateOfBirth: string | null; bloodGroup: string | null; emergencyContact: string | null;
  password: string;
}>): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>('/members/me', payload);
  return data.data;
}

export interface ClubInfo {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  slogan?: string | null;
  monthlyFee?: number | null;
  currency?: string | null;
  createdAt: string;
  _count: { memberships: number };
}

export interface ClubBranding {
  id: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  slogan?: string | null;
}

export async function getClub(): Promise<ClubInfo> {
  const { data } = await api.get<ApiResponse<ClubInfo>>('/club');
  return data.data;
}

export async function updateClub(payload: { name?: string; description?: string }): Promise<ClubInfo> {
  const { data } = await api.patch<ApiResponse<ClubInfo>>('/club', payload);
  return data.data;
}

export async function getClubBranding(): Promise<ClubBranding> {
  const { data } = await api.get<ApiResponse<ClubBranding>>('/club/branding');
  return data.data;
}

export async function updateClubBranding(payload: {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slogan?: string;
}): Promise<ClubBranding> {
  const { data } = await api.patch<ApiResponse<ClubBranding>>('/club/branding', payload);
  return data.data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return data.publicUrl;
}

function resizeImage(file: File, size: number = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        // Calculate dimensions to maintain aspect ratio
        const ratio = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * ratio) / 2;
        const y = (size - img.height * ratio) / 2;
        ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadLogo(file: File, oldLogoUrl?: string | null): Promise<string> {
  // Delete old logo if it exists
  if (oldLogoUrl) {
    try {
      const oldPath = oldLogoUrl.split('/logos/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([`logos/${oldPath}`]);
      }
    } catch (err) {
      console.warn('Failed to delete old logo:', err);
    }
  }

  // Resize image to standard 512x512
  const resizedBlob = await resizeImage(file, 512);
  const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });

  const storagePath = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, resizedFile, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return data.publicUrl;
}
