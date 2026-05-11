import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ProgramMetrics, TrendData, TopProgram } from '@/types';

export function useProgramMetrics(programId: string, period: string = '24h') {
  return useQuery({
    queryKey: ['analytics', 'metrics', programId, period],
    queryFn: async () => {
      const response = await apiClient.get<ProgramMetrics>(
        `/analytics/program/${programId}`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useProgramTrends(
  programId: string,
  metric: string = 'transactions',
  period: string = '7d'
) {
  return useQuery({
    queryKey: ['analytics', 'trends', programId, metric, period],
    queryFn: async () => {
      const response = await apiClient.get<TrendData[]>(
        `/analytics/program/${programId}/trends`,
        { params: { metric, period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useTopPrograms(limit: number = 10, period: string = '24h') {
  return useQuery({
    queryKey: ['analytics', 'top-programs', limit, period],
    queryFn: async () => {
      const response = await apiClient.get<TopProgram[]>('/analytics/top-programs', {
        params: { limit, period },
      });
      return response.data;
    },
    refetchInterval: 60000,
  });
}

export function useTransactionDistribution(programId: string, period: string = '24h') {
  return useQuery({
    queryKey: ['analytics', 'distribution', programId, period],
    queryFn: async () => {
      const response = await apiClient.get<{ success: number; failed: number; total: number }>(
        `/analytics/program/${programId}/distribution`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useHourlyActivity(programId: string) {
  return useQuery({
    queryKey: ['analytics', 'hourly', programId],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(
        `/analytics/program/${programId}/hourly`
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useComputeEfficiency(programId: string, period: string = '7d') {
  return useQuery({
    queryKey: ['analytics', 'compute', programId, period],
    queryFn: async () => {
      const response = await apiClient.get<any>(
        `/analytics/program/${programId}/compute-efficiency`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useFeeAnalysis(programId: string, period: string = '7d') {
  return useQuery({
    queryKey: ['analytics', 'fees', programId, period],
    queryFn: async () => {
      const response = await apiClient.get<any>(
        `/analytics/program/${programId}/fee-analysis`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useTopSigners(programId: string, period: string = '7d', limit: number = 10) {
  return useQuery({
    queryKey: ['analytics', 'signers', programId, period, limit],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(
        `/analytics/program/${programId}/top-signers`,
        { params: { period, limit } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useErrorBreakdown(programId: string, period: string = '7d') {
  return useQuery({
    queryKey: ['analytics', 'errors', programId, period],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(
        `/analytics/program/${programId}/error-breakdown`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useUniqueUsers(programId: string, period: string = '7d') {
  return useQuery({
    queryKey: ['analytics', 'users', programId, period],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(
        `/analytics/program/${programId}/unique-users`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

// ─── Instruction Analytics Hooks ─────────────────────────────────────────────

export function useInstructionOverview(programId: string, windowHours = 24) {
  return useQuery({
    queryKey: ['instructions', 'overview', programId, windowHours],
    queryFn: async () => {
      const res = await apiClient.get(`/programs/${programId}/instructions/overview`, {
        params: { window: windowHours },
      });
      return res.data;
    },
    enabled: !!programId,
    refetchInterval: 30000,
  });
}

export function useInstructionLeaderboard(
  programId: string,
  metric = 'calls',
  windowHours = 24,
  limit = 10,
) {
  return useQuery({
    queryKey: ['instructions', 'leaderboard', programId, metric, windowHours],
    queryFn: async () => {
      const res = await apiClient.get(`/programs/${programId}/instructions/leaderboard`, {
        params: { metric, window: windowHours, limit },
      });
      return res.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

export function useInstructionUsage(
  programId: string,
  instructionName: string,
  windowHours = 24,
) {
  return useQuery({
    queryKey: ['instructions', 'usage', programId, instructionName, windowHours],
    queryFn: async () => {
      const res = await apiClient.get(
        `/programs/${programId}/instructions/${encodeURIComponent(instructionName)}/usage`,
        { params: { window: windowHours } },
      );
      return res.data;
    },
    enabled: !!programId && !!instructionName,
    refetchInterval: 30000,
  });
}

export function useInstructionErrors(
  programId: string,
  instructionName: string,
  windowHours = 24,
) {
  return useQuery({
    queryKey: ['instructions', 'errors', programId, instructionName, windowHours],
    queryFn: async () => {
      const res = await apiClient.get(
        `/programs/${programId}/instructions/${encodeURIComponent(instructionName)}/errors`,
        { params: { window: windowHours } },
      );
      return res.data;
    },
    enabled: !!programId && !!instructionName,
    refetchInterval: 30000,
  });
}

export function useInstructionLog(
  programId: string,
  options: {
    instruction?: string;
    success?: boolean;
    errorCode?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  return useQuery({
    queryKey: ['instructions', 'log', programId, options],
    queryFn: async () => {
      const res = await apiClient.get(`/programs/${programId}/instructions/log`, {
        params: {
          instruction: options.instruction,
          success: options.success,
          errorCode: options.errorCode,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
      });
      return res.data;
    },
    enabled: !!programId,
    refetchInterval: 15000,
  });
}

export function useNewErrors(programId: string, sinceHours = 24) {
  return useQuery({
    queryKey: ['instructions', 'new-errors', programId, sinceHours],
    queryFn: async () => {
      const res = await apiClient.get(`/programs/${programId}/instructions/new-errors`, {
        params: { since: sinceHours },
      });
      return res.data;
    },
    enabled: !!programId,
    refetchInterval: 60000,
  });
}

// ─── Health Score Hooks ───────────────────────────────────────────────────────

export function useProgramHealthScore(programId: string) {
  return useQuery({
    queryKey: ['health', programId],
    queryFn: async () => {
      const res = await apiClient.get(`/programs/${programId}/health`);
      return res.data;
    },
    enabled: !!programId,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAllHealthScores() {
  return useQuery({
    queryKey: ['health', 'all'],
    queryFn: async () => {
      const res = await apiClient.get('/health/all');
      return res.data as any[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
