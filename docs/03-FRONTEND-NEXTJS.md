# Frontend Development Guide - Next.js 14

## 🎯 Overview

This document provides a comprehensive guide for building the Probe frontend using Next.js 14 with the App Router, TypeScript, and modern React patterns.

## 📋 Table of Contents

1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Core Features Implementation](#core-features-implementation)
4. [Real-Time Integration](#real-time-integration)
5. [State Management](#state-management)
6. [UI Components](#ui-components)
7. [Data Visualization](#data-visualization)
8. [Authentication Flow](#authentication-flow)

## 🚀 Project Setup

### Initialize Next.js Project

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest probe-frontend --typescript --tailwind --app --src-dir

# Navigate to project
cd probe-frontend

# Install dependencies
npm install @tanstack/react-query axios
npm install socket.io-client
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install recharts
npm install date-fns
npm install lucide-react
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge

# Install dev dependencies
npm install -D @types/node
```

### Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
```

### Environment Configuration

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Solana Configuration
NEXT_PUBLIC_SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://api.devnet.solana.com

# Application
NEXT_PUBLIC_APP_NAME=Probe
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── programs/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── transactions/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── alerts/
│   │   │   │       └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── alerts/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── dashboard/
│   ├── programs/
│   ├── transactions/
│   ├── charts/
│   └── layout/
│
├── lib/
│   ├── api/
│   ├── websocket/
│   ├── solana/
│   └── utils/
│
├── hooks/
├── store/
├── types/
└── config/
```

## 🔧 Core Configuration

### API Client Setup

**`src/lib/api/client.ts`**

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### WebSocket Client Setup

**`src/lib/websocket/socket.ts`**

```typescript
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.socket?.disconnect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  subscribeToProgram(programId: string, network: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe:program', { programId, network });
  }

  unsubscribeFromProgram(programId: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('unsubscribe:program', { programId });
  }

  onTransaction(callback: (transaction: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.on('transaction:new', callback);
  }

  onAlert(callback: (alert: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.on('alert:triggered', callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) {
      return;
    }

    this.socket.off(event, callback);
  }
}

export const socketClient = new SocketClient();
```

### React Query Provider

**`src/app/providers.tsx`**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Update `src/app/layout.tsx`:**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Probe - Solana Program Observability',
  description: 'Real-time monitoring and analytics for Solana programs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 🔐 Authentication Implementation

### Auth Store (Zustand)

**`src/store/auth.store.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Auth Hook

**`src/hooks/use-auth.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { socketClient } from '@/lib/websocket/socket';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data;
      setAuth(user, accessToken, refreshToken);
      
      // Store tokens in localStorage for API client
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Connect WebSocket
      socketClient.connect(accessToken);
      
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/login');
    },
  });

  const logout = () => {
    clearAuth();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    socketClient.disconnect();
    queryClient.clear();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
```

### Login Page

**`src/app/(auth)/login/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in to Probe</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {loginError.message || 'Invalid email or password'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

## 📊 Dashboard Implementation

### Programs Hook

**`src/hooks/use-programs.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface Program {
  id: string;
  name: string;
  programId: string;
  network: string;
  description?: string;
  repositoryUrl?: string;
  createdAt: string;
  _count?: {
    transactions: number;
    alerts: number;
  };
}

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
    mutationFn: async (data: Partial<Program>) => {
      const response = await apiClient.post('/programs', data);
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
    deleteProgram: deleteProgramMutation.mutate,
    isCreating: createProgramMutation.isPending,
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
```

### Dashboard Page

**`src/app/(dashboard)/dashboard/page.tsx`**

```typescript
'use client';

import { usePrograms } from '@/hooks/use-programs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, ActivityIcon, AlertTriangleIcon, TrendingUpIcon } from 'lucide-react';
import Link from 'next/link';
import { ProgramCard } from '@/components/programs/program-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { PerformanceChart } from '@/components/dashboard/performance-chart';

export default function DashboardPage() {
  const { programs, isLoading } = usePrograms();

  const stats = [
    {
      title: 'Total Programs',
      value: programs?.length || 0,
      icon: ActivityIcon,
      description: 'Active programs monitored',
    },
    {
      title: 'Total Transactions',
      value: programs?.reduce((acc, p) => acc + (p._count?.transactions || 0), 0) || 0,
      icon: TrendingUpIcon,
      description: 'Transactions processed',
    },
    {
      title: 'Active Alerts',
      value: programs?.reduce((acc, p) => acc + (p._count?.alerts || 0), 0) || 0,
      icon: AlertTriangleIcon,
      description: 'Alert rules configured',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Monitor your Solana programs in real-time</p>
        </div>
        <Link href="/programs/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Programs Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Programs</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ActivityIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No programs yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first program</p>
              <Link href="/programs/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Program
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions />
        <PerformanceChart />
      </div>
    </div>
  );
}
```

## 📊 Continue to Next Sections

This is Part 1 of the Frontend Guide. The complete implementation includes:
- Real-time transaction monitoring
- Data visualization with charts
- Program management
- Alert configuration
- Analytics dashboard

---

**Next**: [04-SMART-CONTRACTS.md](./04-SMART-CONTRACTS.md)
