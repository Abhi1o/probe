import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Program, CreateProgramData } from '@/types';

export function usePrograms() {
  const queryClient = useQueryClient();

  const { data: programs, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await apiClient.get<Program[]>('/programs');
      return response.data;
    },
  });

  const createProgramMutation = useMutation({
    mutationFn: async (data: CreateProgramData) => {
      const response = await apiClient.post<Program>('/programs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProgramData> }) => {
      const response = await apiClient.patch<Program>(`/programs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  return {
    programs,
    isLoading,
    error,
    createProgram: createProgramMutation.mutate,
    updateProgram: updateProgramMutation.mutate,
    deleteProgram: deleteProgramMutation.mutate,
    isCreating: createProgramMutation.isPending,
    isUpdating: updateProgramMutation.isPending,
    isDeleting: deleteProgramMutation.isPending,
  };
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      const response = await apiClient.get<Program>(`/programs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useProgramStats(id: string) {
  return useQuery({
    queryKey: ['programs', id, 'stats'],
    queryFn: async () => {
      const response = await apiClient.get(`/programs/${id}/stats`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
