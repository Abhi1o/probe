import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SolanaService } from '../solana/solana.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private solanaService: SolanaService,
  ) {}

  async create(userId: string, createProgramDto: CreateProgramDto) {
    // Validate Solana program ID
    const isValid = await this.solanaService.isValidAddress(createProgramDto.programId);
    if (!isValid) {
      throw new ForbiddenException('Invalid Solana program ID');
    }

    // Check if program already exists
    const existing = await this.prisma.program.findUnique({
      where: { programId: createProgramDto.programId },
    });

    if (existing) {
      throw new ForbiddenException('Program already registered');
    }

    return this.prisma.program.create({
      data: {
        name: createProgramDto.name,
        programId: createProgramDto.programId,
        network: createProgramDto.network as any,
        description: createProgramDto.description,
        repositoryUrl: createProgramDto.repositoryUrl,
        isActive: true,
        user: {
          connect: { id: userId }
        }
      },
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    
    return this.prisma.program.findMany({
      where,
      include: {
        _count: {
          select: {
            transactions: true,
            alerts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId?: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            alerts: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (userId && program.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return program;
  }

  async update(id: string, userId: string | any, updateProgramDto?: UpdateProgramDto | any) {
    // Handle both signatures: update(id, userId, dto) and update(id, data)
    if (typeof userId === 'string' && updateProgramDto) {
      // Normal update with userId check
      const program = await this.findOne(id, userId);
      return this.prisma.program.update({
        where: { id },
        data: updateProgramDto,
      });
    } else {
      // Direct update for ownership verification (userId is actually the data object)
      return this.prisma.program.update({
        where: { id },
        data: userId,
      });
    }
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.program.delete({
      where: { id },
    });

    return { message: 'Program deleted successfully' };
  }

  async getStats(id: string, userId?: string) {
    await this.findOne(id, userId);

    const [totalTx, successTx, failedTx, last24h, computeAgg, feeAgg] = await Promise.all([
      this.prisma.transaction.count({
        where: { programId: id },
      }),
      this.prisma.transaction.count({
        where: { programId: id, status: 'SUCCESS' },
      }),
      this.prisma.transaction.count({
        where: { programId: id, status: 'FAILED' },
      }),
      this.prisma.transaction.count({
        where: {
          programId: id,
          blockTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.transaction.aggregate({
        where: { programId: id, computeUnits: { not: null } },
        _avg: { computeUnits: true },
      }),
      this.prisma.transaction.aggregate({
        where: { programId: id },
        _avg: { fee: true },
      }),
    ]);

    const successRate = totalTx > 0 ? (successTx / totalTx) * 100 : 0;

    return {
      totalTransactions: totalTx,
      successfulTransactions: successTx,
      failedTransactions: failedTx,
      successRate: Number(successRate),
      last24Hours: last24h,
      avgComputeUnits: Number(computeAgg._avg.computeUnits ?? 0),
      avgFee: Number(feeAgg._avg.fee ?? 0),  // BigInt → Number
    };
  }
}
