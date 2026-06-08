import { api } from './api';
import type { ApiResponse, Payment, PaginatedResponse } from '../types';

export async function getMyPayments(): Promise<any[]> {
  const { data } = await api.get<ApiResponse<any[]>>('/payments/my');
  return data.data;
}

export async function getAllPayments(params?: { page?: number; status?: string; month?: number; year?: number }): Promise<PaginatedResponse<Payment>> {
  const { data } = await api.get<{ success: boolean; data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>('/payments', {
    params: { page: params?.page ?? 1, limit: 50, status: params?.status, month: params?.month, year: params?.year },
  });
  return { items: data.data ?? [], total: data.meta?.total ?? 0, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 50, totalPages: data.meta?.totalPages ?? 1 };
}

export async function markPaymentPaid(paymentId: string): Promise<Payment> {
  const { data } = await api.patch<ApiResponse<Payment>>(`/payments/${paymentId}/mark-paid`);
  return data.data;
}

export async function mockPayApi(paymentId: string): Promise<Payment> {
  const { data } = await api.post<ApiResponse<Payment>>(`/payments/${paymentId}/mock-pay`);
  return data.data;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
  clubName: string;
  month: number;
  year: number;
}

export async function createOrder(paymentId: string): Promise<RazorpayOrder> {
  const { data } = await api.post<ApiResponse<RazorpayOrder>>('/payments/create-order', { paymentId });
  return data.data;
}

export async function verifyPayment(payload: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Payment> {
  const { data } = await api.post<ApiResponse<Payment>>('/payments/verify', payload);
  return data.data;
}
