import { useEffect, useState, useCallback } from 'react';
import { socketClient } from '@/lib/websocket/socket';
import { useAuthStore } from '@/store/auth.store';
import type { Transaction, Alert } from '@/types';

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    // Connect to WebSocket
    const socket = socketClient.connect(accessToken);

    // Update connection status
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [isAuthenticated, accessToken]);

  const subscribeToProgram = useCallback((programId: string, network: string = 'mainnet-beta') => {
    socketClient.subscribeToProgram(programId, network);
  }, []);

  const unsubscribeFromProgram = useCallback((programId: string) => {
    socketClient.unsubscribeFromProgram(programId);
  }, []);

  return {
    isConnected,
    subscribeToProgram,
    unsubscribeFromProgram,
  };
}

export function useProgramTransactions(programId: string, network: string = 'mainnet-beta') {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { subscribeToProgram, unsubscribeFromProgram } = useWebSocket();

  useEffect(() => {
    if (!programId) return;

    // Subscribe to program
    subscribeToProgram(programId, network);

    // Listen for initial transactions
    socketClient.onInitialTransactions((txs) => {
      setTransactions(txs);
    });

    // Listen for new transactions
    socketClient.onTransaction((tx) => {
      setTransactions((prev) => [tx, ...prev].slice(0, 100)); // Keep last 100
    });

    return () => {
      unsubscribeFromProgram(programId);
      socketClient.off('transaction:new');
      socketClient.off('initial:transactions');
    };
  }, [programId, network, subscribeToProgram, unsubscribeFromProgram]);

  return transactions;
}

export function useAlertNotifications() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    socketClient.onAlert((alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50
    });

    return () => {
      socketClient.off('alert:triggered');
    };
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    clearAlerts,
  };
}
