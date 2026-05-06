import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAllTransactions(options?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.blockTime = {};
      if (options.startDate) where.blockTime.gte = options.startDate;
      if (options.endDate) where.blockTime.lte = options.endDate;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: { blockTime: 'desc' },
        select: {
          id: true,
          signature: true,
          programId: true,
          slot: true,
          blockTime: true,
          status: true,
          fee: true,
          computeUnits: true,
          signer: true,
          error: true,
          logs: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Serialize BigInt fields to strings so JSON.stringify works
    const serialized = transactions.map((tx) => ({
      ...tx,
      id: tx.id.toString(),
      slot: tx.slot.toString(),
      fee: tx.fee.toString(),
    }));

    return {
      data: serialized,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  async findAll(programId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { programId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.blockTime = {};
      if (options.startDate) where.blockTime.gte = options.startDate;
      if (options.endDate) where.blockTime.lte = options.endDate;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: { blockTime: 'desc' },
        select: {
          id: true,
          signature: true,
          slot: true,
          blockTime: true,
          status: true,
          fee: true,
          computeUnits: true,
          signer: true,
          error: true,
          logs: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Serialize BigInt fields to strings so JSON.stringify works
    const serialized = transactions.map((tx) => ({
      ...tx,
      id: tx.id.toString(),
      slot: tx.slot.toString(),
      fee: tx.fee.toString(),
    }));

    return {
      data: serialized,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  async findOne(signature: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { signature },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            programId: true,
            network: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      ...transaction,
      id: transaction.id.toString(),
      slot: transaction.slot.toString(),
      fee: transaction.fee.toString(),
    };
  }

  async getRecentByProgram(programId: string, limit: number = 10) {
    const txs = await this.prisma.transaction.findMany({
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
      },
    });
    return txs.map((tx) => ({
      ...tx,
      id: tx.id.toString(),
      fee: tx.fee.toString(),
    }));
  }

  async getStats(programId: string, period: '1h' | '24h' | '7d' | '30d' = '24h') {
    const periodMap = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const startTime = new Date(Date.now() - periodMap[period]);

    const [total, success, failed, avgCompute, avgFee] = await Promise.all([
      this.prisma.transaction.count({
        where: { programId, blockTime: { gte: startTime } },
      }),
      this.prisma.transaction.count({
        where: { programId, blockTime: { gte: startTime }, status: 'SUCCESS' },
      }),
      this.prisma.transaction.count({
        where: { programId, blockTime: { gte: startTime }, status: 'FAILED' },
      }),
      this.prisma.transaction.aggregate({
        where: { programId, blockTime: { gte: startTime }, computeUnits: { not: null } },
        _avg: { computeUnits: true },
      }),
      this.prisma.transaction.aggregate({
        where: { programId, blockTime: { gte: startTime } },
        _avg: { fee: true },
      }),
    ]);

    return {
      period,
      totalTransactions: total,
      successfulTransactions: success,
      failedTransactions: failed,
      successRate: total > 0 ? ((success / total) * 100).toFixed(2) : '0',
      avgComputeUnits: avgCompute._avg.computeUnits || 0,
      avgFee: Number(avgFee._avg.fee || 0),
    };
  }
}
