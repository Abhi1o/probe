import axios, { AxiosInstance } from 'axios';
import { Program, Transaction, Alert, Metric, User } from './types';

export interface ProbeClientConfig {
  apiUrl?: string;
  apiKey?: string;
  accessToken?: string;
}

export class ProbeClient {
  private client: AxiosInstance;

  constructor(config: ProbeClientConfig) {
    const apiUrl = config.apiUrl || process.env.PROBE_API_URL || 'http://localhost:3000';
    this.client = axios.create({
      baseURL: `${apiUrl}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.accessToken && { Authorization: `Bearer ${config.accessToken}` }),
      },
    });
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/register', { email, password, name });
    return response.data;
  }

  // Programs
  async getPrograms(): Promise<Program[]> {
    const response = await this.client.get('/programs');
    return response.data;
  }

  async getProgram(id: string): Promise<Program> {
    const response = await this.client.get(`/programs/${id}`);
    return response.data;
  }

  async createProgram(data: {
    name: string;
    programId: string;
    network: string;
    description?: string;
  }): Promise<Program> {
    const response = await this.client.post('/programs', data);
    return response.data;
  }

  async getProgramStats(id: string) {
    const response = await this.client.get(`/programs/${id}/stats`);
    return response.data;
  }

  // Ownership Verification
  async generateOwnershipMessage(programId: string, walletAddress: string) {
    const response = await this.client.post(
      `/programs/${programId}/ownership/generate-message`,
      { walletAddress }
    );
    return response.data;
  }

  async verifyOwnership(
    programId: string,
    walletAddress: string,
    signature?: string,
    message?: string
  ) {
    const response = await this.client.post(`/programs/${programId}/ownership/verify`, {
      walletAddress,
      signature,
      message,
    });
    return response.data;
  }

  async getOwnership(programId: string) {
    const response = await this.client.get(`/programs/${programId}/ownership`);
    return response.data;
  }

  // Transactions
  async getTransactions(programId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Transaction[]> {
    const response = await this.client.get(`/transactions/program/${programId}`, {
      params: options,
    });
    return response.data.data;
  }

  async getTransaction(signature: string): Promise<Transaction> {
    const response = await this.client.get(`/transactions/${signature}`);
    return response.data;
  }

  async getTransactionStats(programId: string) {
    const response = await this.client.get(`/transactions/program/${programId}/stats`);
    return response.data;
  }

  // Analytics
  async getAnalytics(programId: string, options?: {
    startDate?: string;
    endDate?: string;
    interval?: string;
  }): Promise<Metric[]> {
    const response = await this.client.get(`/analytics/program/${programId}`, {
      params: options,
    });
    return response.data;
  }

  async getTrends(programId: string) {
    const response = await this.client.get(`/analytics/program/${programId}/trends`);
    return response.data;
  }

  async getTopPrograms() {
    const response = await this.client.get('/analytics/top-programs');
    return response.data;
  }

  // Alerts
  async getAlerts(programId: string): Promise<Alert[]> {
    const response = await this.client.get(`/alerts/program/${programId}`);
    return response.data;
  }

  async createAlert(data: {
    programId: string;
    name: string;
    condition: string;
    threshold: number;
    comparison: string;
    channels: string[];
  }): Promise<Alert> {
    const response = await this.client.post('/alerts', data);
    return response.data;
  }

  async updateAlert(id: string, data: Partial<Alert>): Promise<Alert> {
    const response = await this.client.patch(`/alerts/${id}`, data);
    return response.data;
  }

  async deleteAlert(id: string): Promise<void> {
    await this.client.delete(`/alerts/${id}`);
  }
}
