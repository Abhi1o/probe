import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface MevSummary {
  programId: string;
  totalEvents: number;
  totalEstimatedLostSol: number;
  byType: Record<string, { count: number; estimatedLostSol: number }>;
  topAttackers: { wallet: string; count: number; estimatedProfitSol: number }[];
  topVictims: { wallet: string; count: number; estimatedLostSol: number }[];
  recentEvents: MevEventRow[];
  vulnerabilityScore: number;
  recommendations: string[];
}

export interface MevEventRow {
  id: string;
  mevType: string;
  severity: string;
  attackerWallet: string | null;
  victimWallet: string | null;
  estimatedLostSol: number;
  estimatedProfitSol: number;
  description: string | null;
  detectedAt: Date;
  victimSignature: string | null;
}

@Injectable()
export class MevService {
  private readonly logger = new Logger(MevService.name);

  constructor(private prisma: PrismaService) {}

  // ── Detect MEV patterns from stored transaction data ──────────────────────
  async detectMevPatterns(programId: string): Promise<number> {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { programId: true, name: true },
    });
    if (!program) return 0;

    // Get recent transactions with rawData, ordered by slot
    const txs = await this.prisma.$queryRaw<any[]>`
      SELECT
        id, signature, slot, status, signer, fee, "computeUnits",
        "blockTime", "rawData"
      FROM transactions
      WHERE "programId" = ${programId}
        AND "rawData" IS NOT NULL
        AND "blockTime" >= NOW() - INTERVAL '7 days'
      ORDER BY slot ASC, id ASC
      LIMIT 10000
    `;

    let detected = 0;

    // Group transactions by slot for sandwich detection
    const bySlot = new Map<string, any[]>();
    for (const tx of txs) {
      const slotKey = tx.slot?.toString() ?? '0';
      if (!bySlot.has(slotKey)) bySlot.set(slotKey, []);
      bySlot.get(slotKey)!.push(tx);
    }

    // ── Pattern 1: Sandwich Attack Detection ─────────────────────────────
    // Same wallet appears before AND after a different wallet in the same slot
    for (const [slot, slotTxs] of bySlot) {
      if (slotTxs.length < 3) continue;

      for (let i = 0; i < slotTxs.length - 2; i++) {
        const front = slotTxs[i];
        const victim = slotTxs[i + 1];
        const back = slotTxs[i + 2];

        // Classic sandwich: front.signer === back.signer, victim.signer is different
        if (
          front.signer &&
          back.signer &&
          victim.signer &&
          front.signer === back.signer &&
          front.signer !== victim.signer &&
          front.status === 'SUCCESS' &&
          back.status === 'SUCCESS'
        ) {
          // Estimate loss: difference in fees + compute costs
          const victimFee = Number(victim.fee ?? 0);
          const estimatedLoss = Math.max(0, victimFee * 2); // rough estimate

          // Check if this event already exists
          const existing = await this.prisma.mevEvent.findFirst({
            where: {
              programId,
              victimSignature: victim.signature,
              mevType: 'sandwich',
            },
          });

          if (!existing) {
            await this.prisma.mevEvent.create({
              data: {
                programId,
                mevType: 'sandwich',
                severity: estimatedLoss > 100000 ? 'high' : 'medium',
                victimSignature: victim.signature,
                attackerSignature: front.signature,
                relatedSignatures: [front.signature, victim.signature, back.signature],
                attackerWallet: front.signer,
                victimWallet: victim.signer,
                estimatedLostLamports: BigInt(estimatedLoss),
                estimatedProfitLamports: BigInt(Math.floor(estimatedLoss * 0.7)),
                slot: BigInt(slot),
                description: `Sandwich attack: ${front.signer.slice(0, 8)}... wrapped ${victim.signer.slice(0, 8)}... in slot ${slot}`,
              },
            });
            detected++;
          }
        }
      }
    }

    // ── Pattern 2: High-frequency same-wallet bursts (bot detection) ──────
    // Same wallet sending >10 transactions in a single slot
    const walletSlotCounts = new Map<string, Map<string, number>>();
    for (const tx of txs) {
      if (!tx.signer || !tx.slot) continue;
      const slotKey = tx.slot.toString();
      if (!walletSlotCounts.has(tx.signer)) walletSlotCounts.set(tx.signer, new Map());
      const slotMap = walletSlotCounts.get(tx.signer)!;
      slotMap.set(slotKey, (slotMap.get(slotKey) ?? 0) + 1);
    }

    for (const [wallet, slotMap] of walletSlotCounts) {
      for (const [slot, count] of slotMap) {
        if (count >= 5) {
          const existing = await this.prisma.mevEvent.findFirst({
            where: { programId, attackerWallet: wallet, mevType: 'arbitrage', slot: BigInt(slot) },
          });
          if (!existing) {
            await this.prisma.mevEvent.create({
              data: {
                programId,
                mevType: 'arbitrage',
                severity: count >= 10 ? 'high' : 'medium',
                attackerWallet: wallet,
                relatedSignatures: [],
                slot: BigInt(slot),
                description: `High-frequency bot: ${wallet.slice(0, 8)}... sent ${count} transactions in slot ${slot}`,
              },
            });
            detected++;
          }
        }
      }
    }

    this.logger.log(`Detected ${detected} MEV events for program ${program.name}`);
    return detected;
  }

  // ── Get MEV summary for a program ─────────────────────────────────────────
  async getMevSummary(programId: string, days = 30): Promise<MevSummary> {
    const since = new Date(Date.now() - days * 86400000);

    const [events, attackerStats, victimStats] = await Promise.all([
      this.prisma.mevEvent.findMany({
        where: { programId, detectedAt: { gte: since } },
        orderBy: { detectedAt: 'desc' },
        take: 100,
      }),
      this.prisma.$queryRaw<any[]>`
        SELECT "attackerWallet", COUNT(*)::int AS cnt,
          SUM("estimatedProfitLamports")::bigint AS total_profit
        FROM mev_events
        WHERE "programId" = ${programId}
          AND "detectedAt" >= ${since}
          AND "attackerWallet" IS NOT NULL
        GROUP BY "attackerWallet"
        ORDER BY cnt DESC LIMIT 10
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT "victimWallet", COUNT(*)::int AS cnt,
          SUM("estimatedLostLamports")::bigint AS total_lost
        FROM mev_events
        WHERE "programId" = ${programId}
          AND "detectedAt" >= ${since}
          AND "victimWallet" IS NOT NULL
        GROUP BY "victimWallet"
        ORDER BY cnt DESC LIMIT 10
      `,
    ]);

    // Aggregate by type
    const byType: Record<string, { count: number; estimatedLostSol: number }> = {};
    let totalLost = BigInt(0);

    for (const e of events) {
      const type = e.mevType;
      if (!byType[type]) byType[type] = { count: 0, estimatedLostSol: 0 };
      byType[type].count++;
      byType[type].estimatedLostSol += Number(e.estimatedLostLamports) / 1e9;
      totalLost += e.estimatedLostLamports;
    }

    // Vulnerability score (0-100)
    const sandwichCount = byType['sandwich']?.count ?? 0;
    const arbCount = byType['arbitrage']?.count ?? 0;
    const vulnerabilityScore = Math.min(100, Math.round(
      sandwichCount * 5 + arbCount * 2
    ));

    // Recommendations
    const recommendations: string[] = [];
    if (sandwichCount > 5) {
      recommendations.push(`${sandwichCount} sandwich attacks detected. Consider recommending Jito bundles to your users for MEV protection.`);
    }
    if (arbCount > 10) {
      recommendations.push(`High bot activity (${arbCount} arbitrage events). Consider rate limiting or priority fee requirements.`);
    }
    if (vulnerabilityScore === 0) {
      recommendations.push('No MEV activity detected. Your program appears well-protected.');
    }

    return {
      programId,
      totalEvents: events.length,
      totalEstimatedLostSol: Number(totalLost) / 1e9,
      byType,
      topAttackers: attackerStats.map(a => ({
        wallet: a.attackerWallet,
        count: Number(a.cnt),
        estimatedProfitSol: Number(a.total_profit ?? 0) / 1e9,
      })),
      topVictims: victimStats.map(v => ({
        wallet: v.victimWallet,
        count: Number(v.cnt),
        estimatedLostSol: Number(v.total_lost ?? 0) / 1e9,
      })),
      recentEvents: events.slice(0, 20).map(e => ({
        id: e.id,
        mevType: e.mevType,
        severity: e.severity,
        attackerWallet: e.attackerWallet,
        victimWallet: e.victimWallet,
        estimatedLostSol: Number(e.estimatedLostLamports) / 1e9,
        estimatedProfitSol: Number(e.estimatedProfitLamports) / 1e9,
        description: e.description,
        detectedAt: e.detectedAt,
        victimSignature: e.victimSignature,
      })),
      vulnerabilityScore,
      recommendations,
    };
  }

  // ── Get global MEV stats across all programs ──────────────────────────────
  async getGlobalMevStats() {
    const stats = await this.prisma.$queryRaw<any[]>`
      SELECT
        "mevType",
        COUNT(*)::int AS total_events,
        SUM("estimatedLostLamports")::bigint AS total_lost,
        COUNT(DISTINCT "attackerWallet")::int AS unique_attackers,
        COUNT(DISTINCT "victimWallet")::int AS unique_victims
      FROM mev_events
      WHERE "detectedAt" >= NOW() - INTERVAL '30 days'
      GROUP BY "mevType"
      ORDER BY total_events DESC
    `;

    return stats.map(s => ({
      mevType: s.mevType,
      totalEvents: Number(s.total_events),
      totalLostSol: Number(s.total_lost ?? 0) / 1e9,
      uniqueAttackers: Number(s.unique_attackers),
      uniqueVictims: Number(s.unique_victims),
    }));
  }
}
