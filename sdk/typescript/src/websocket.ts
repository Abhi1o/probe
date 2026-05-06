import WebSocket from 'ws';
import { WebSocketMessage, TransactionEvent, AlertEvent } from './types';

export interface ProbeWebSocketConfig {
  wsUrl: string;
  accessToken: string;
}

export class ProbeWebSocket {
  private ws: WebSocket | null = null;
  private config: ProbeWebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: ProbeWebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl, {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        });

        this.ws.on('open', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.ws.on('close', () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.listeners.get(message.event);
    if (listeners) {
      listeners.forEach((callback) => callback(message.data));
    }
  }

  // Subscribe to events
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Subscribe to program events
  subscribeToProgram(programId: string): void {
    this.send('subscribe', { programId });
  }

  unsubscribeFromProgram(programId: string): void {
    this.send('unsubscribe', { programId });
  }

  // Send message
  private send(event: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // Convenience methods for specific events
  onTransaction(callback: (data: TransactionEvent) => void): void {
    this.on('transaction:new', callback);
  }

  onTransactionFailed(callback: (data: TransactionEvent) => void): void {
    this.on('transaction:failed', callback);
  }

  onAlert(callback: (data: AlertEvent) => void): void {
    this.on('alert:triggered', callback);
  }

  onProgramUpdated(callback: (data: any) => void): void {
    this.on('program:updated', callback);
  }

  onMetricsUpdated(callback: (data: any) => void): void {
    this.on('metrics:updated', callback);
  }
}
