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
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Program subscription
  subscribeToProgram(programId: string, network: string = 'mainnet-beta') {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe:program', { programId, network });
    console.log(`📡 Subscribed to program: ${programId}`);
  }

  unsubscribeFromProgram(programId: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('unsubscribe:program', { programId });
    console.log(`📡 Unsubscribed from program: ${programId}`);
  }

  // Event listeners
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

  onInitialTransactions(callback: (transactions: any[]) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.on('initial:transactions', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) {
      return;
    }

    this.socket.off(event, callback);
  }

  // Remove all listeners for an event
  removeAllListeners(event?: string) {
    if (!this.socket) {
      return;
    }

    if (event) {
      this.socket.removeAllListeners(event);
    } else {
      this.socket.removeAllListeners();
    }
  }
}

export const socketClient = new SocketClient();
