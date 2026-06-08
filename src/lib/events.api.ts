import { api } from './api';
import type { ApiResponse, Event, PaginatedResponse } from '../types';

export async function getEvents(params?: { upcoming?: boolean; page?: number }): Promise<PaginatedResponse<Event>> {
  const { data } = await api.get<{ success: boolean; data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>('/events', {
    params: { page: params?.page ?? 1, limit: 30, upcoming: params?.upcoming ? 'true' : undefined },
  });
  return { items: data.data ?? [], total: data.meta?.total ?? 0, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 30, totalPages: data.meta?.totalPages ?? 1 };
}

export async function getEvent(eventId: string): Promise<Event> {
  const { data } = await api.get<ApiResponse<Event>>(`/events/${eventId}`);
  return data.data;
}

export async function createEvent(payload: {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
}): Promise<Event> {
  const { data } = await api.post<ApiResponse<Event>>('/events', payload);
  return data.data;
}

export async function rsvpEvent(eventId: string, status: 'GOING' | 'NOT_GOING' | 'MAYBE'): Promise<void> {
  await api.post(`/events/${eventId}/rsvp`, { status });
}
