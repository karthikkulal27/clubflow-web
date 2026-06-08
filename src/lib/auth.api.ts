import { api } from './api';
import type { ApiResponse } from '../types';
import type { AuthUser } from '../store/auth.store';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterClubPayload {
  name: string;
  phone: string;
  password: string;
  clubName: string;
  sport: string;
}

export interface JoinClubPayload {
  name: string;
  phone: string;
  password: string;
  inviteCode: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return data.data;
}

export async function registerClubApi(payload: RegisterClubPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register/club', payload);
  return data.data;
}

export async function joinClubApi(payload: JoinClubPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register/member', payload);
  return data.data;
}

export async function refreshTokenApi(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
  return data.data;
}
