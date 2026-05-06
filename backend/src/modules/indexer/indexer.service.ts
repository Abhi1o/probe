import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { SolanaService } from '../solana/solana.service';
import { ParsedTransactionWithMeta, ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private readonly BATCH_SIZE = 100; // Process 100 at a time
  private readonly MAX_SIGNATURES_PER_FETCH = 500; // Fetch 500 signatures per program (increased from 100)
  private isIndexing = false;

  constructor(
    private prisma: PrismaService,
    private solanaService: SolanaService,
  ) {}

  @Cron('*/30 * * * * *')  // Every 30 seconds - balance between freshness and rate limits
  async indexNewTransactions() {
    if (this.isIndexing) {
      this.logger.debug('Indexing already in progress, skipping...');
      return;
    }

    this.isIndexing = true;

    try {
      const programs = await this.prisma.program.findMany({
        where: { isActive: true },
      });

      this.logger.log(`Starting indexing for ${programs.length} active programs`);

      for (const program of programs) {
        await this.indexProgramTransactions(program.id, program.programId);
      }

      this.logger.log('Indexing cycle completed');
    } catch (error) {
      this.logger.error('Error indexing transactions:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  async indexProgramTransactions(programId: string, solanaAddress: string) {
    try {
      // Get program to determine network
      const program = await this.prisma.program.findUnique({
        where: { id: programId },
        select: { network: true, name: true },
      });

      if (!program) {
        this.logger.error(`Program ${programId} not found`);
        return;
      }

      // Get latest indexed signature
      const latestTx = await this.prisma.transaction.findFirst({
        where: { programId },
        orderBy: { blockTime: 'desc' },
        select: { signature: true, blockTime: true },
      });

      this.logger.log(
        `Indexing program ${program.name} (${solanaAddress}) on ${program.network}, latest tx: ${latestTx?.signature || 'none'}`,
      );

      // Fetch new signatures from Solana using the correct network
      const signatures = await this.fetchSignatures(
        solanaAddress,
        program.network,
        latestTx?.signature,
      );

      if (signatures.length === 0) {
        this.logger.debug(`No new transactions for program ${solanaAddress} on ${program.network}`);
        return;
      }

      this.logger.log(`Found ${signatures.length} new signatures for ${solanaAddress} on ${program.network}`);

      // Process signatures in batches
      const batches = this.chunkArray(
        signatures.map(s => s.signature),
        this.BATCH_SIZE,
      );

      let totalIndexed = 0;
      for (const batch of batches) {
        const indexed = await this.indexTransactionBatch(batch, programId, program.network);
        totalIndexed += indexed.length;
      }

      this.logger.log(
        `Successfully indexed ${totalIndexed}/${signatures.length} transactions for program ${solanaAddress} on ${program.network}`,
      );

      // Update program's last indexed time
      await this.prisma.program.update({
        where: { id: programId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Error indexing program ${programId}:`, error);
    }
  }

  private async fetchSignatures(
    address: string,
    network: string,
    latestSignature?: string,
  ): Promise<ConfirmedSignatureInfo[]> {
    try {
      const options: any = {
        limit: this.MAX_SIGNATURES_PER_FETCH,
      };

      // DON'T use 'until' or 'before' when fetching NEW transactions!
      // When latestSignature exists, we want transactions AFTER it (newer ones)
      // Solana API returns newest first by default, so we just fetch without parameters
      // Then filter out transactions we already have
      
      // If we have no latest signature, fetch the most recent transactions
      // If we have a latest signature, we'll filter in the calling code

      const signatures = await this.solanaService.getSignaturesForAddress(
        address,
        options,
        network,
      );

      // Filter out transactions we already have (older than or equal to latestSignature)
      if (latestSignature) {
        const latestIndex = signatures.findIndex(s => s.signature === latestSignature);
        if (latestIndex > 0) {
          // Return only signatures BEFORE the latest one we found (newer transactions)
          return signatures.slice(0, latestIndex);
        } else if (latestIndex === -1) {
          // Latest signature not found in results, return all (they're all newer)
          return signatures;
        } else {
          // latestIndex === 0, meaning latest signature is the first result (no new transactions)
          return [];
        }
      }

      return signatures;
    } catch (error) {
      this.logger.error(`Error fetching signatures for ${address} on ${network}:`, error);
      return [];
    }
  }

  async indexTransaction(signature: string, programId: string, network: string) {
    try {
      const tx = await this.solanaService.getTransaction(signature, network);
      
      if (!tx) {
        this.logger.warn(`Transaction ${signature} not found on ${network}`);
        return null;
      }

      const parsed = this.parseTransaction(tx);
      
      // Check if transaction already exists
      const existing = await this.prisma.transaction.findFirst({
        where: { signature },
      });
      
      if (existing) {
        return existing;
      }
      
      return await this.prisma.transaction.create({
        data: {
          ...parsed,
          programId,
          signature,
        },
      });
    } catch (error) {
      this.logger.error(`Error indexing transaction ${signature} on ${network}:`, error);
      return null;
    }
  }

  async indexTransactionBatch(signatures: string[], programId: string, network: string) {
    try {
      const transactions = await this.solanaService.getTransactionBatch(signatures, network);
      
      const parsed = transactions
        .filter((tx) => tx !== null)
        .map((tx) => {
          const txData = this.parseTransaction(tx!);
          return {
            ...txData,
            programId,
          };
        });

      // Bulk insert - skip duplicates
      const results = await Promise.allSettled(
        parsed.map(async (tx) => {
          // Check if transaction already exists
          const existing = await this.prisma.transaction.findFirst({
            where: { signature: tx.signature },
          });
          
          if (!existing) {
            return this.prisma.transaction.create({
              data: tx,
            });
          }
          return existing;
        }),
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        this.logger.warn(
          `Failed to index ${failed.length}/${results.length} transactions on ${network}`,
        );
      }

      this.logger.log(
        `Indexed ${successful.length} transactions for program ${programId} on ${network}`,
      );
      
      return successful.map((r: any) => r.value);
    } catch (error) {
      this.logger.error(`Error indexing transaction batch on ${network}:`, error);
      return [];
    }
  }

  private parseTransaction(tx: ParsedTransactionWithMeta): any {
    const meta = tx.meta;
    const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();
    
    // Extract signer (first account key)
    const signer = tx.transaction.message.accountKeys[0]?.pubkey.toString() || '';
    
    // Determine status
    const status = meta?.err ? 'FAILED' : 'SUCCESS';
    
    // Extract compute units consumed
    const computeUnits = meta?.computeUnitsConsumed || null;
    
    // Extract fee
    const fee = BigInt(meta?.fee || 0);
    
    // Extract logs
    const logs = meta?.logMessages || [];
    
    // Extract error if any
    const error = meta?.err ? JSON.stringify(meta.err) : null;

    return {
      signature: tx.transaction.signatures[0],
      slot: BigInt(tx.slot),
      blockTime,
      blockDateUtc: new Date(blockTime.toISOString().split('T')[0]),
      status,
      fee,
      computeUnits,
      signer,
      instructions: tx.transaction.message.instructions as any,
      logs,
      error,
      rawData: tx as any,
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async reindexProgram(programId: string) {
    try {
      const program = await this.prisma.program.findUnique({
        where: { id: programId },
      });

      if (!program) {
        throw new Error(`Program ${programId} not found`);
      }

      this.logger.log(`Starting full reindex for program ${program.programId} on ${program.network}`);

      // Delete existing transactions
      await this.prisma.transaction.deleteMany({
        where: { programId },
      });

      // Reindex from scratch
      await this.indexProgramTransactions(programId, program.programId);

      this.logger.log(`Reindex completed for program ${program.programId} on ${program.network}`);
      
      return { success: true, message: 'Reindex completed' };
    } catch (error) {
      this.logger.error(`Error reindexing program ${programId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async getIndexingStatus() {
    const programs = await this.prisma.program.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return {
      isIndexing: this.isIndexing,
      totalPrograms: programs.length,
      programs: programs.map(p => ({
        id: p.id,
        name: p.name,
        programId: p.programId,
        transactionCount: p._count.transactions,
        lastUpdated: p.updatedAt,
      })),
    };
  }
}
