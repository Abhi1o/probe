import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface Subscription {
  clientId: string;
  programId: string;
  filters?: any;
}

@Injectable()
export class MonitorService {
  private subscriptions: Map<string, Subscription[]> = new Map();

  constructor(private prisma: PrismaService) {}

  addSubscription(clientId: string, programId: string, filters?: any) {
    const existing = this.subscriptions.get(clientId) || [];
    existing.push({ clientId, programId, filters });
    this.subscriptions.set(clientId, existing);
  }

  removeSubscription(clientId: string, programId: string) {
    const existing = this.subscriptions.get(clientId) || [];
    const filtered = existing.filter((sub) => sub.programId !== programId);
    this.subscriptions.set(clientId, filtered);
  }

  unsubscribeAll(clientId: string) {
    this.subscriptions.delete(clientId);
  }

  getSubscriptions(clientId: string): Subscription[] {
    return this.subscriptions.get(clientId) || [];
  }

  async getRecentTransactions(programId: string, limit: number = 10) {
    return this.prisma.transaction.findMany({
      where: { programId },
      take: limit,
      orderBy: { blockTime: 'desc' },
      select: {
        id: true,
        signature: true,
        blockTime: true,
        status: true,
        fee: true,
        computeUnits: true,
        signer: true,
      },
    });
  }
}
