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
}>): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>('/members/me', payload);
  return data.data;
}

export interface ClubInfo {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  monthlyFee?: number | null;
  currency?: string | null;
  createdAt: string;
  _count: { memberships: number };
}

export async function getClub(): Promise<ClubInfo> {
  const { data } = await api.get<ApiResponse<ClubInfo>>('/club');
  return data.data;
}

export async function updateClub(payload: { name?: string; description?: string }): Promise<ClubInfo> {
  const { data } = await api.patch<ApiResponse<ClubInfo>>('/club', payload);
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
