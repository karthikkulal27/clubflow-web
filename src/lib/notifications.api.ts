import { api } from './api';
import type { Notification, PaginatedResponse } from '../types';

export async function getNotifications(page = 1): Promise<PaginatedResponse<Notification>> {
  const { data } = await api.get<{ success: boolean; data: any[]; meta: any }>('/notifications', { params: { page, limit: 30 } });
  return { items: data.data ?? [], total: data.meta?.total ?? 0, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 30, totalPages: data.meta?.totalPages ?? 1 };
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
