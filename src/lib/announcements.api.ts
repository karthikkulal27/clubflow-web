import { api } from './api';
import type { ApiResponse, Announcement, PaginatedResponse } from '../types';

export async function getAnnouncements(page = 1): Promise<PaginatedResponse<Announcement>> {
  const { data } = await api.get<{ success: boolean; data: any[]; meta: any }>('/announcements', { params: { page, limit: 30 } });
  return { items: data.data ?? [], total: data.meta?.total ?? 0, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 30, totalPages: data.meta?.totalPages ?? 1 };
}

export async function createAnnouncement(payload: { title: string; body: string; publish?: boolean }): Promise<Announcement> {
  const { data } = await api.post<ApiResponse<Announcement>>('/announcements', { title: payload.title, body: payload.body });
  if (payload.publish !== false && data.data.id) {
    try { await publishAnnouncement(data.data.id); } catch {}
  }
  return data.data;
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
  const { data } = await api.post<ApiResponse<Announcement>>(`/announcements/${id}/publish`);
  return data.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/announcements/${id}`);
}
