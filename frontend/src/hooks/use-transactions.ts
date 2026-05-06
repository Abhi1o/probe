import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Transaction, TransactionStats } from '@/types';

export function useTransactions(programId: string, params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['transactions', programId, params],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: Transaction[];
        total: number;
        limit: number;
        offset: number;
      }>(
        `/transactions/program/${programId}`,
        { params }
      );
      // Return the paginated response with the data array
      return response.data;
    },
    enabled: !!programId && programId !== 'all',
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useAllTransactions(params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['transactions', 'all', params],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: Transaction[];
        total: number;
        limit: number;
        offset: number;
      }>(
        `/transactions`,
        { params }
      );
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useTransaction(signature: string) {
  return useQuery({
    queryKey: ['transactions', signature],
    queryFn: async () => {
      const response = await apiClient.get<Transaction>(`/transactions/${signature}`);
      return response.data;
    },
    enabled: !!signature,
  });
}

export function useTransactionStats(programId: string, period: string = '24h') {
  return useQuery({
    queryKey: ['transactions', programId, 'stats', period],
    queryFn: async () => {
      const response = await apiClient.get<TransactionStats>(
        `/transactions/program/${programId}/stats`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
