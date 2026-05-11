import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { SolanaService } from '../solana/solana.service';
import { ParsedTransactionWithMeta, ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js';

// Known Anchor discriminator → instruction name mappings for common programs
// These are the first 8 bytes of sha256("global:<instruction_name>")
const KNOWN_DISCRIMINATORS: Record<string, string> = {
  // SPL Token
  'f8c69e91e17587c8': 'transfer',
  '3a4b0d3b4c5e6f7a': 'mintTo',
  '9e2a3b4c5d6e7f8a': 'burn',
  'b712469c952a8d9e': 'initializeMint',
  '1aa26b4a0e6c4d5e': 'initializeAccount',
  // Generic patterns
};

// Error code patterns from Solana logs
const ANCHOR_ERROR_PATTERN = /Error Code: (\d+)\. Error Number: \d+\. Error Message: (.+?)(?:\.|$)/;
const CUSTOM_ERROR_PATTERN = /custom program error: (0x[0-9a-fA-F]+)/;
const ANCHOR_ERROR_NAME_PATTERN = /AnchorError caused by account: .+\. Error Code: (\w+)\./;

function classifyError(errorCode: string, errorName: string | null): string {
  if (!errorName) return 'unknown';
  const name = errorName.toLowerCase();
  if (name.match(/unauthorized|permission|access|signer|authority|owner/)) return 'access_control';
  if (name.match(/invalid|wrong|mismatch|not_found|mint/)) return 'validation';
  if (name.match(/overflow|underflow|divide|math|arithmetic/)) return 'math';
  if (name.match(/already|initialized|closed|frozen|paused|state/)) return 'state';
  if (name.match(/cpi|oracle|price|feed|external/)) return 'external';
  if (name.match(/compute|budget|rent/)) return 'system';
  const code = parseInt(errorCode);
  if (code >= 6000 && code <= 9999) return 'business_logic';
  return 'unknown';
}

function parseAnchorError(
  err: any,
  logs: string[],
): { code: string | null; name: string | null; message: string | null } {
  for (const log of logs) {
    const anchorMatch = log.match(ANCHOR_ERROR_PATTERN);
    if (anchorMatch) {
      return { code: anchorMatch[1], name: null, message: anchorMatch[2].trim() };
    }
    const customMatch = log.match(CUSTOM_ERROR_PATTERN);
    if (customMatch) {
      const hex = customMatch[1];
      return { code: parseInt(hex, 16).toString(), name: null, message: `Custom error ${hex}` };
    }
  }
  if (err && typeof err === 'object') {
    const errStr = JSON.stringify(err);
    const match = errStr.match(/"InstructionError":\[(\d+),\{"Custom":(\d+)\}\]/);
    if (match) {
      return { code: match[2], name: null, message: `Instruction error at index ${match[1]}` };
    }
  }
  return { code: null, name: null, message: null };
}

function getComputeBudgetLimit(tx: ParsedTransactionWithMeta): number | null {
  try {
    const COMPUTE_BUDGET_PROGRAM = 'ComputeBudget111111111111111111111111111111';
    for (const ix of tx.transaction.message.instructions) {
      const partial = ix as any;
      if (partial.programId?.toString() === COMPUTE_BUDGET_PROGRAM && partial.data) {
        const buf = Buffer.from(partial.data, 'base64');
        // SetComputeUnitLimit instruction discriminator = 0x02
        if (buf[0] === 0x02 && buf.length >= 5) {
          return buf.readUInt32LE(1);
        }
      }
    }
  } catch {}
  return null;
}

function getPriorityFeeLamports(tx: ParsedTransactionWithMeta): bigint {
  try {
    const COMPUTE_BUDGET_PROGRAM = 'ComputeBudget111111111111111111111111111111';
    let unitPrice = 0;
    let unitLimit = 200000; // default
    for (const ix of tx.transaction.message.instructions) {
      const partial = ix as any;
      if (partial.programId?.toString() === COMPUTE_BUDGET_PROGRAM && partial.data) {
        const buf = Buffer.from(partial.data, 'base64');
        if (buf[0] === 0x03 && buf.length >= 9) {
          // SetComputeUnitPrice
          unitPrice = Number(buf.readBigUInt64LE(1));
        }
        if (buf[0] === 0x02 && buf.length >= 5) {
          unitLimit = buf.readUInt32LE(1);
        }
      }
    }
    return BigInt(Math.floor((unitPrice * unitLimit) / 1_000_000));
  } catch {}
  return BigInt(0);
}

function getInvolvedPrograms(tx: ParsedTransactionWithMeta): string[] {
  const programs = new Set<string>();
  for (const ix of tx.transaction.message.instructions) {
    const partial = ix as any;
    if (partial.programId) programs.add(partial.programId.toString());
  }
  for (const inner of tx.meta?.innerInstructions || []) {
    for (const ix of inner.instructions) {
      const partial = ix as any;
      if (partial.programId) programs.add(partial.programId.toString());
    }
  }
  return [...programs];
}

function getInstructionName(data: string | undefined): { name: string | null; discriminator: string | null } {
  if (!data) return { name: null, discriminator: null };
  try {
    const buf = Buffer.from(data, 'base64');
    if (buf.length < 8) return { name: null, discriminator: null };
    const discriminator = buf.slice(0, 8).toString('hex');
    const name = KNOWN_DISCRIMINATORS[discriminator] || null;
    return { name, discriminator };
  } catch {
    return { name: null, discriminator: null };
  }
}

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private readonly BATCH_SIZE = 100;
  private readonly MAX_SIGNATURES_PER_FETCH = 500;
  private isIndexing = false;

  constructor(
    private prisma: PrismaService,
    private solanaService: SolanaService,
  ) {}

  @Cron('*/30 * * * * *')
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
      const program = await this.prisma.program.findUnique({
        where: { id: programId },
        select: { network: true, name: true },
      });

      if (!program) {
        this.logger.error(`Program ${programId} not found`);
        return;
      }

      const latestTx = await this.prisma.transaction.findFirst({
        where: { programId },
        orderBy: { blockTime: 'desc' },
        select: { signature: true, blockTime: true },
      });

      this.logger.log(
        `Indexing program ${program.name} (${solanaAddress}) on ${program.network}, latest tx: ${latestTx?.signature || 'none'}`,
      );

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

      const batches = this.chunkArray(
        signatures.map(s => s.signature),
        this.BATCH_SIZE,
      );

      let totalIndexed = 0;
      for (const batch of batches) {
        const indexed = await this.indexTransactionBatch(batch, programId, program.network, solanaAddress);
        totalIndexed += indexed.length;
      }

      this.logger.log(
        `Successfully indexed ${totalIndexed}/${signatures.length} transactions for program ${solanaAddress} on ${program.network}`,
      );

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
      const options: any = { limit: this.MAX_SIGNATURES_PER_FETCH };

      const signatures = await this.solanaService.getSignaturesForAddress(
        address,
        options,
        network,
      );

      if (latestSignature) {
        const latestIndex = signatures.findIndex(s => s.signature === latestSignature);
        if (latestIndex > 0) {
          return signatures.slice(0, latestIndex);
        } else if (latestIndex === -1) {
          return signatures;
        } else {
          return [];
        }
      }

      return signatures;
    } catch (error) {
      this.logger.error(`Error fetching signatures for ${address} on ${network}:`, error);
      return [];
    }
  }

  async indexTransaction(signature: string, programId: string, network: string, programAddress?: string) {
    try {
      const tx = await this.solanaService.getTransaction(signature, network);
      if (!tx) {
        this.logger.warn(`Transaction ${signature} not found on ${network}`);
        return null;
      }

      const parsed = this.parseTransaction(tx);

      const existing = await this.prisma.transaction.findFirst({ where: { signature } });
      if (existing) return existing;

      const created = await this.prisma.transaction.create({
        data: { ...parsed, programId, signature },
      });

      // Extract instruction-level records
      if (programAddress) {
        await this.extractInstructionRecords(tx, programId, programAddress, network);
      }

      return created;
    } catch (error) {
      this.logger.error(`Error indexing transaction ${signature} on ${network}:`, error);
      return null;
    }
  }

  async indexTransactionBatch(
    signatures: string[],
    programId: string,
    network: string,
    programAddress?: string,
  ) {
    try {
      const transactions = await this.solanaService.getTransactionBatch(signatures, network);

      const parsed = transactions
        .filter((tx) => tx !== null)
        .map((tx) => {
          const txData = this.parseTransaction(tx!);
          return { ...txData, programId, _rawTx: tx };
        });

      const results = await Promise.allSettled(
        parsed.map(async ({ _rawTx, ...tx }) => {
          const existing = await this.prisma.transaction.findFirst({
            where: { signature: tx.signature },
          });

          if (!existing) {
            const created = await this.prisma.transaction.create({ data: tx });

            // Extract instruction-level records for each new transaction
            if (_rawTx && programAddress) {
              await this.extractInstructionRecords(
                _rawTx as ParsedTransactionWithMeta,
                programId,
                programAddress,
                network,
              ).catch(err =>
                this.logger.warn(`Failed to extract instructions for ${tx.signature}: ${err.message}`),
              );
            }

            return created;
          }
          return existing;
        }),
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        this.logger.warn(`Failed to index ${failed.length}/${results.length} transactions on ${network}`);
      }

      this.logger.log(`Indexed ${successful.length} transactions for program ${programId} on ${network}`);
      return successful.map((r: any) => r.value);
    } catch (error) {
      this.logger.error(`Error indexing transaction batch on ${network}:`, error);
      return [];
    }
  }

  /**
   * Extract instruction-level analytics from a transaction.
   * This is the core of the "Alchemy Monitor per-method" feature.
   */
  private async extractInstructionRecords(
    tx: ParsedTransactionWithMeta,
    programId: string,
    programAddress: string,
    network: string,
  ): Promise<void> {
    if (!tx.transaction?.message?.instructions) return;

    const success = !tx.meta?.err;
    const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();
    const callerWallet = tx.transaction.message.accountKeys[0]?.pubkey?.toString() || null;
    const computeUnitsUsed = tx.meta?.computeUnitsConsumed || null;
    const computeUnitsRequested = getComputeBudgetLimit(tx);
    const feeLamports = tx.meta?.fee ? BigInt(tx.meta.fee) : null;
    const priorityFeeLamports = getPriorityFeeLamports(tx);
    const involvedPrograms = getInvolvedPrograms(tx);
    const cpiCount = tx.meta?.innerInstructions?.reduce(
      (sum, inner) => sum + inner.instructions.length,
      0,
    ) || 0;

    // Parse error info
    let errorCode: string | null = null;
    let errorName: string | null = null;
    let errorMessage: string | null = null;
    let errorCategory: string | null = null;

    if (!success && tx.meta?.err) {
      const errInfo = parseAnchorError(tx.meta.err, tx.meta.logMessages || []);
      errorCode = errInfo.code;
      errorName = errInfo.name;
      errorMessage = errInfo.message;
      errorCategory = errorCode ? classifyError(errorCode, errorName) : null;
    }

    // Process each outer instruction that calls our program
    for (const ix of tx.transaction.message.instructions) {
      const partial = ix as any;
      const ixProgramId = partial.programId?.toString();

      if (ixProgramId !== programAddress) continue;

      const { name: instructionName, discriminator } = getInstructionName(partial.data);

      // Check if this instruction record already exists
      const existingRecord = await this.prisma.instructionCallRecord.findFirst({
        where: { signature: tx.transaction.signatures[0], programId },
      });

      if (existingRecord) continue;

      await this.prisma.instructionCallRecord.create({
        data: {
          programId,
          environment: network,
          instructionName,
          instructionDiscriminator: discriminator,
          signature: tx.transaction.signatures[0],
          slot: BigInt(tx.slot),
          blockTime,
          success,
          errorCode,
          errorName,
          errorMessage,
          errorCategory,
          computeUnitsUsed,
          computeUnitsRequested,
          feeLamports,
          priorityFeeLamports,
          callerWallet,
          cpiCount,
          involvedPrograms,
          timestamp: blockTime,
        },
      });

      // Update hourly aggregate
      await this.upsertHourlyAggregate(
        programId,
        instructionName || 'unknown',
        network,
        blockTime,
        success,
        computeUnitsUsed,
        callerWallet,
      );
    }
  }

  private async upsertHourlyAggregate(
    programId: string,
    instructionName: string,
    environment: string,
    timestamp: Date,
    success: boolean,
    computeUnits: number | null,
    callerWallet: string | null,
  ): Promise<void> {
    try {
      const bucket = new Date(timestamp);
      bucket.setMinutes(0, 0, 0);

      await this.prisma.$executeRaw`
        INSERT INTO instruction_hourly_aggregates
          ("programId", "instructionName", environment, bucket, "callCount", "successCount", "failureCount", "errorRate", "successRate", "avgComputeUnits", "uniqueCallers", "createdAt", "updatedAt")
        VALUES
          (${programId}, ${instructionName}, ${environment}, ${bucket},
           1,
           ${success ? 1 : 0},
           ${success ? 0 : 1},
           ${success ? 0.0 : 1.0},
           ${success ? 1.0 : 0.0},
           ${computeUnits},
           1,
           NOW(), NOW())
        ON CONFLICT ("programId", "instructionName", environment, bucket)
        DO UPDATE SET
          "callCount" = instruction_hourly_aggregates."callCount" + 1,
          "successCount" = instruction_hourly_aggregates."successCount" + ${success ? 1 : 0},
          "failureCount" = instruction_hourly_aggregates."failureCount" + ${success ? 0 : 1},
          "errorRate" = (instruction_hourly_aggregates."failureCount" + ${success ? 0 : 1})::float
                        / (instruction_hourly_aggregates."callCount" + 1),
          "successRate" = (instruction_hourly_aggregates."successCount" + ${success ? 1 : 0})::float
                          / (instruction_hourly_aggregates."callCount" + 1),
          "avgComputeUnits" = CASE
            WHEN ${computeUnits} IS NOT NULL
            THEN (COALESCE(instruction_hourly_aggregates."avgComputeUnits", 0) * instruction_hourly_aggregates."callCount" + ${computeUnits ?? 0})
                 / (instruction_hourly_aggregates."callCount" + 1)
            ELSE instruction_hourly_aggregates."avgComputeUnits"
          END,
          "updatedAt" = NOW()
      `;
    } catch (err) {
      // Non-critical — don't fail the main indexing
      this.logger.debug(`Failed to upsert hourly aggregate: ${err.message}`);
    }
  }

  private parseTransaction(tx: ParsedTransactionWithMeta): any {
    const meta = tx.meta;
    const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();
    const signer = tx.transaction.message.accountKeys[0]?.pubkey.toString() || '';
    const status = meta?.err ? 'FAILED' : 'SUCCESS';
    const computeUnits = meta?.computeUnitsConsumed || null;
    const fee = BigInt(meta?.fee || 0);
    const logs = meta?.logMessages || [];
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
      const program = await this.prisma.program.findUnique({ where: { id: programId } });
      if (!program) throw new Error(`Program ${programId} not found`);

      this.logger.log(`Starting full reindex for program ${program.programId} on ${program.network}`);

      await this.prisma.transaction.deleteMany({ where: { programId } });
      await this.prisma.instructionCallRecord.deleteMany({ where: { programId } });
      await this.prisma.instructionHourlyAggregate.deleteMany({ where: { programId } });

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
      include: { _count: { select: { transactions: true } } },
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

