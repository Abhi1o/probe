export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  userId: string;
  programId: string;
  name: string;
  description?: string;
  network: string;
  repositoryUrl?: string;
  isActive: boolean;
  ownerWallet?: string;
  upgradeAuthority?: string;
  verificationMethod?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  programId: string;
  signature: string;
  slot: number;
  blockTime: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  fee: number;
  computeUnits?: number;
  signer: string;
  instructions?: any;
  logs?: string[];
  error?: string;
  indexedAt: string;
}

export interface Metric {
  id: string;
  programId: string;
  timestamp: string;
  hour: string;
  txCount: number;
  successCount: number;
  failureCount: number;
  avgComputeUnits?: number;
  avgFee?: number;
  medianComputeUnits?: number;
  createdAt: string;
}

export interface Alert {
  id: string;
  programId: string;
  name: string;
  description?: string;
  condition: string;
  threshold: number;
  comparison: string;
  channels: string[];
  cooldown: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketMessage {
  event: string;
  data: any;
}

export interface TransactionEvent {
  programId: string;
  signature: string;
  status: string;
  timestamp: string;
}

export interface AlertEvent {
  alertId: string;
  programId: string;
  condition: string;
  value: number;
  timestamp: string;
}
