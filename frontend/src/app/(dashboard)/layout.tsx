'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { socketClient } from '@/lib/websocket/socket';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, accessToken } = useAuthStore();

  // Handle hydration and mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only perform auth checks after the component has mounted on the client
    // This allows Zustand's persist middleware to hydrate the store from localStorage
    if (!mounted) return;

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login...');
      router.push('/login');
      return;
    }

    // Connect WebSocket if authenticated
    if (accessToken && !socketClient.isConnected()) {
      socketClient.connect(accessToken);
    }
  }, [mounted, isAuthenticated, accessToken, router]);

  // Prevent flash of content or premature redirect
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#03050c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14f195] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden ">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
