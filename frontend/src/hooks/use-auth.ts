import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { socketClient } from '@/lib/websocket/socket';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data;
      setAuth(user, accessToken, refreshToken);
      
      // Connect WebSocket
      socketClient.connect(accessToken);
      
      router.push('/dashboard');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/login?registered=true');
    },
  });

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Logout function
  const logout = () => {
    clearAuth();
    socketClient.disconnect();
    queryClient.clear();
    router.push('/login');
  };

  return {
    user: currentUser || user,
    isAuthenticated,
    isLoadingUser,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
