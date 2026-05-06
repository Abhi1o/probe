// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Program types
export interface Program {
  id: string;
  name: string;
  programId: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  description?: string;
  repositoryUrl?: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
    alerts: number;
  };
}

export interface CreateProgramData {
  name: string;
  programId: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  description?: string;
  repositoryUrl?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  signature: string;
  programId?: string;
  blockTime: string;
  slot: string; // BigInt serialized as string
  status: 'SUCCESS' | 'FAILED';
  fee: string; // BigInt serialized as string
  computeUnits?: number;
  signer: string;
  logs?: string[];
  error?: string;
  program?: {
    id: string;
    name: string;
    programId: string;
    network: string;
  };
}

export interface TransactionStats {
  total: number;
  successful: number;
  failed: number;
  avgFee: number;
  avgComputeUnits: number;
}

// Analytics types
export interface ProgramMetrics {
  programId: string;
  period: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  avgFee: number;
  avgComputeUnits: number;
  uniqueUsers: number;
}

export interface TrendData {
  timestamp: string;
  value: number;
}

export interface TopProgram {
  id: string;
  programId: string;
  name: string;
  network: string;
  isActive: boolean;
  transactionCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgComputeUnits: number | null;
  avgFee: number | null;
}

// Alert types
export interface Alert {
  id: string;
  name: string;
  programId: string;
  condition: 'TRANSACTION_COUNT' | 'ERROR_RATE' | 'COMPUTE_UNITS' | 'CUSTOM';
  threshold: number;
  period: number;
  isActive: boolean;
  notificationChannels: ('EMAIL' | 'SLACK' | 'DISCORD')[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    triggers: number;
  };
}

export interface CreateAlertData {
  name: string;
  programId: string;
  condition: 'TRANSACTION_COUNT' | 'ERROR_RATE' | 'COMPUTE_UNITS' | 'CUSTOM';
  threshold: number;
  period: number;
  notificationChannels: ('EMAIL' | 'SLACK' | 'DISCORD')[];
}

export interface AlertTrigger {
  id: string;
  alertId: string;
  value: number;
  message: string;
  triggeredAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'ALERT' | 'INFO' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// WebSocket event types
export interface TransactionEvent {
  type: 'transaction:new';
  data: Transaction;
}

export interface AlertEvent {
  type: 'alert:triggered';
  data: {
    alert: Alert;
    trigger: AlertTrigger;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
