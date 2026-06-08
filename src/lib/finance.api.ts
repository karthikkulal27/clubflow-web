import { api } from './api';
import type { ApiResponse, Expense, PaginatedResponse } from '../types';

export async function getExpenses(page = 1): Promise<PaginatedResponse<Expense>> {
  const { data } = await api.get<{ success: boolean; data: { expenses: any[]; totalAmount: number }; meta: any }>('/expenses', { params: { page, limit: 50 } });
  return { items: data.data?.expenses ?? [], total: data.meta?.total ?? 0, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 50, totalPages: data.meta?.totalPages ?? 1 };
}

export async function addExpense(payload: {
  title: string;
  amount: number;
  expenseDate: string;
  description?: string;
  category?: string;
}): Promise<Expense> {
  const { data } = await api.post<ApiResponse<Expense>>('/expenses', payload);
  return data.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export interface PaymentStats {
  month: number;
  year: number;
  total: number;
  paidCount: number;
  pendingCount: number;
  collectedAmount: number | string;
  pendingAmount: number | string;
}

export async function getPaymentStats(month?: number, year?: number): Promise<PaymentStats> {
  const now = new Date();
  const { data } = await api.get<ApiResponse<PaymentStats>>('/payments/stats', {
    params: { month: month ?? now.getMonth() + 1, year: year ?? now.getFullYear() },
  });
  return data.data;
}

export interface DuesPlan {
  id: string;
  label?: string | null;
  amount: number;
  currency: string;
  periods: { month: number; year: number }[];
  createdAt: string;
}

export async function getDuesPlans(): Promise<DuesPlan[]> {
  const { data } = await api.get<ApiResponse<DuesPlan[]>>('/dues-plans');
  return data.data;
}

export async function createDuesPlan(payload: {
  label?: string;
  amount: number;
  periods: { month: number; year: number }[];
}): Promise<DuesPlan> {
  const { data } = await api.post<ApiResponse<DuesPlan>>('/dues-plans', payload);
  return data.data;
}

export async function deleteDuesPlan(id: string): Promise<void> {
  await api.delete(`/dues-plans/${id}`);
}

export interface SpecialCollection {
  id: string;
  label: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  dueDate: string;
  createdAt: string;
}

export async function getSpecialCollections(): Promise<SpecialCollection[]> {
  const { data } = await api.get<ApiResponse<SpecialCollection[]>>('/special-collections');
  return data.data;
}

export async function createSpecialCollection(payload: {
  label: string;
  amount: number;
  month: number;
  year: number;
  dueDate: string;
}): Promise<SpecialCollection> {
  const { data } = await api.post<ApiResponse<SpecialCollection>>('/special-collections', payload);
  return data.data;
}
