import { api } from './api';
import type { ApiResponse, MemberDashboard, AdminDashboard } from '../types';

export async function getMemberDashboard(): Promise<MemberDashboard> {
  const { data } = await api.get<ApiResponse<MemberDashboard>>('/dashboard');
  return data.data;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<ApiResponse<AdminDashboard>>('/dashboard');
  return data.data;
}
