import { api } from './api';

export interface IncomeEntry {
  id: string;
  clubId: string;
  category: string;
  amount: number;
  description?: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
  };
}

export async function addIncome(data: {
  category: string;
  amount: number;
  description?: string;
}): Promise<IncomeEntry> {
  const response = await api.post('/income', data);
  return response.data.data;
}

export async function getIncome(): Promise<IncomeEntry[]> {
  const response = await api.get('/income');
  return response.data.data;
}

export async function deleteIncome(incomeId: string): Promise<void> {
  await api.delete(`/income/${incomeId}`);
}
