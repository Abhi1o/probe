import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface WalletClassification {
  address: string;
  primaryLabel: 'bot' | 'whale' | 'smart_money' | 'retail' | 'fresh' | 'dormant';
  labels: string[];
  confidence: number;
  stats: {
    totalTxCount: number;
    successRate: number;
    avgTxPerDay: number;
    firstSeenAt: Date | null;
    lastSeenAt: Date | null;
    daysSinceLastSeen: number;
  };
  reasoning: string;
}

export interface ProgramWalletSummary {
  programId: string;
  totalUniqueWallets: number;
  composition: {
    bots: number;
    whales: number;
    smartMoney: number;
    retail: number;
    fresh: number;
    dormant: number;
    botPercent: number;
    whalePercent: number;
  };
  topWallets: WalletClassification[];
  vipWallets: { address: string; txCount: number; successRate: number }[];
}

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Classify a single wallet from its transaction history ─────────────────
  async classifyWallet(address: string): Promise<WalletClassification> {
    const stats = await this.prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*)::int AS total_tx,
        COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS ok,
        MIN("blockTime") AS first_seen,
        MAX("blockTime") AS last_seen,
        COUNT(DISTINCT DATE("blockTime"))::int AS active_days
      FROM transactions
      WHERE signer = ${address}
    `;

    const s = stats[0] || {};
    const totalTx = Number(s.total_tx ?? 0);
    const ok = Number(s.ok ?? 0);
    const successRate = totalTx > 0 ? ok / totalTx : 0;
    const firstSeen = s.first_seen ? new Date(s.first_seen) : null;
    const lastSeen = s.last_seen ? new Date(s.last_seen) : null;
    const activeDays = Number(s.active_days ?? 1);
    const avgTxPerDay = activeDays > 0 ? totalTx / activeDays : 0;

    const daysSinceLastSeen = lastSeen
      ? Math.floor((Date.now() - lastSeen.getTime()) / 86400000)
      : 999;

    const accountAgeDays = firstSeen
      ? Math.floor((Date.now() - firstSeen.getTime()) / 86400000)
      : 0;

    // ── Classification logic ──────────────────────────────────────────────
    const labels: string[] = [];
    let primaryLabel: WalletClassification['primaryLabel'] = 'retail';
    let confidence = 60;
    let reasoning = '';

    // Fresh wallet: <7 days old or <5 transactions
    if (accountAgeDays < 7 || totalTx < 5) {
      labels.push('fresh');
      primaryLabel = 'fresh';
      confidence = 80;
      reasoning = `New wallet: ${accountAgeDays} days old, ${totalTx} transactions`;
    }
    // Dormant: no activity in 90+ days
    else if (daysSinceLastSeen > 90) {
      labels.push('dormant');
      primaryLabel = 'dormant';
      confidence = 85;
      reasoning = `Inactive for ${daysSinceLastSeen} days`;
    }
    // Bot: very high frequency (>50 tx/day) with high success rate
    else if (avgTxPerDay > 50 && successRate > 0.85) {
      labels.push('bot');
      primaryLabel = 'bot';
      confidence = 85;
      reasoning = `High frequency: ${avgTxPerDay.toFixed(1)} tx/day with ${(successRate * 100).toFixed(0)}% success`;
    }
    // High frequency but lower success — likely bot with errors
    else if (avgTxPerDay > 30) {
      labels.push('bot');
      primaryLabel = 'bot';
      confidence = 70;
      reasoning = `High frequency: ${avgTxPerDay.toFixed(1)} tx/day`;
    }
    // Smart money: high success rate + significant activity
    else if (successRate > 0.92 && totalTx > 50 && avgTxPerDay > 2) {
      labels.push('smart_money');
      primaryLabel = 'smart_money';
      confidence = 72;
      reasoning = `High success rate (${(successRate * 100).toFixed(1)}%) with ${totalTx} transactions`;
    }
    // Whale: very high total transaction count
    else if (totalTx > 500) {
      labels.push('whale');
      primaryLabel = 'whale';
      confidence = 75;
      reasoning = `Power user: ${totalTx} total transactions`;
    }
    else {
      primaryLabel = 'retail';
      confidence = 65;
      reasoning = `Standard retail behavior: ${totalTx} tx, ${avgTxPerDay.toFixed(1)} tx/day`;
    }

    // Upsert wallet profile
    await this.prisma.walletProfile.upsert({
      where: { address },
      create: {
        address,
        primaryLabel,
        isBot: primaryLabel === 'bot',
        isWhale: primaryLabel === 'whale',
        isSmartMoney: primaryLabel === 'smart_money',
        isFresh: primaryLabel === 'fresh',
        isDormant: primaryLabel === 'dormant',
        totalTxCount: totalTx,
        successRate,
        avgTxPerDay,
        firstSeenAt: firstSeen,
        lastSeenAt: lastSeen,
      },
      update: {
        primaryLabel,
        isBot: primaryLabel === 'bot',
        isWhale: primaryLabel === 'whale',
        isSmartMoney: primaryLabel === 'smart_money',
        isFresh: primaryLabel === 'fresh',
        isDormant: primaryLabel === 'dormant',
        totalTxCount: totalTx,
        successRate,
        avgTxPerDay,
        firstSeenAt: firstSeen,
        lastSeenAt: lastSeen,
      },
    });

    return {
      address,
      primaryLabel,
      labels,
      confidence,
      stats: { totalTxCount: totalTx, successRate, avgTxPerDay, firstSeenAt: firstSeen, lastSeenAt: lastSeen, daysSinceLastSeen },
      reasoning,
    };
  }

  // ── Classify all wallets for a program ────────────────────────────────────
  async classifyProgramWallets(programId: string): Promise<number> {
    const wallets = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT signer FROM transactions
      WHERE "programId" = ${programId} AND signer IS NOT NULL AND signer != ''
      LIMIT 500
    `;

    let classified = 0;
    for (const { signer } of wallets) {
      await this.classifyWallet(signer).catch(() => null);
      classified++;
    }

    this.logger.log(`Classified ${classified} wallets for program ${programId}`);
    return classified;
  }

  // ── Get wallet composition for a program ─────────────────────────────────
  async getProgramWalletSummary(programId: string): Promise<ProgramWalletSummary> {
    // Get top wallets by tx count for this program
    const topWalletRows = await this.prisma.$queryRaw<any[]>`
      SELECT
        signer,
        COUNT(*)::int AS tx_count,
        COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS ok,
        MIN("blockTime") AS first_seen,
        MAX("blockTime") AS last_seen
      FROM transactions
      WHERE "programId" = ${programId} AND signer IS NOT NULL AND signer != ''
      GROUP BY signer
      ORDER BY tx_count DESC
      LIMIT 50
    `;

    const totalUniqueWallets = topWalletRows.length;

    // Classify each top wallet
    const classified: WalletClassification[] = [];
    for (const row of topWalletRows.slice(0, 20)) {
      const txCount = Number(row.tx_count);
      const ok = Number(row.ok);
      const successRate = txCount > 0 ? ok / txCount : 0;
      const firstSeen = row.first_seen ? new Date(row.first_seen) : null;
      const lastSeen = row.last_seen ? new Date(row.last_seen) : null;
      const accountAgeDays = firstSeen ? Math.floor((Date.now() - firstSeen.getTime()) / 86400000) : 0;
      const daysSinceLastSeen = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 86400000) : 999;
      const activeDays = Math.max(1, accountAgeDays);
      const avgTxPerDay = txCount / activeDays;

      let primaryLabel: WalletClassification['primaryLabel'] = 'retail';
      if (accountAgeDays < 7 || txCount < 5) primaryLabel = 'fresh';
      else if (daysSinceLastSeen > 90) primaryLabel = 'dormant';
      else if (avgTxPerDay > 50 && successRate > 0.85) primaryLabel = 'bot';
      else if (avgTxPerDay > 30) primaryLabel = 'bot';
      else if (successRate > 0.92 && txCount > 50) primaryLabel = 'smart_money';
      else if (txCount > 500) primaryLabel = 'whale';

      classified.push({
        address: row.signer,
        primaryLabel,
        labels: [primaryLabel],
        confidence: 70,
        stats: { totalTxCount: txCount, successRate, avgTxPerDay, firstSeenAt: firstSeen, lastSeenAt: lastSeen, daysSinceLastSeen },
        reasoning: `${txCount} tx, ${avgTxPerDay.toFixed(1)}/day`,
      });
    }

    // Count by label
    const counts = { bot: 0, whale: 0, smart_money: 0, retail: 0, fresh: 0, dormant: 0 };
    for (const w of classified) counts[w.primaryLabel]++;

    // VIP wallets: >100 tx with this program
    const vipWallets = topWalletRows
      .filter(r => Number(r.tx_count) >= 100)
      .slice(0, 10)
      .map(r => ({
        address: r.signer,
        txCount: Number(r.tx_count),
        successRate: Number(r.tx_count) > 0 ? Number(r.ok) / Number(r.tx_count) : 0,
      }));

    return {
      programId,
      totalUniqueWallets,
      composition: {
        bots: counts.bot,
        whales: counts.whale,
        smartMoney: counts.smart_money,
        retail: counts.retail,
        fresh: counts.fresh,
        dormant: counts.dormant,
        botPercent: totalUniqueWallets > 0 ? (counts.bot / totalUniqueWallets) * 100 : 0,
        whalePercent: totalUniqueWallets > 0 ? (counts.whale / totalUniqueWallets) * 100 : 0,
      },
      topWallets: classified,
      vipWallets,
    };
  }

  // ── Get a single wallet profile ───────────────────────────────────────────
  async getWalletProfile(address: string): Promise<WalletClassification> {
    const cached = await this.prisma.walletProfile.findUnique({ where: { address } });

    if (cached && (Date.now() - cached.updatedAt.getTime()) < 3600000) {
      return {
        address,
        primaryLabel: cached.primaryLabel as WalletClassification['primaryLabel'],
        labels: [cached.primaryLabel],
        confidence: 70,
        stats: {
          totalTxCount: cached.totalTxCount,
          successRate: cached.successRate,
          avgTxPerDay: cached.avgTxPerDay,
          firstSeenAt: cached.firstSeenAt,
          lastSeenAt: cached.lastSeenAt,
          daysSinceLastSeen: cached.lastSeenAt
            ? Math.floor((Date.now() - cached.lastSeenAt.getTime()) / 86400000)
            : 999,
        },
        reasoning: `Cached classification: ${cached.primaryLabel}`,
      };
    }

    return this.classifyWallet(address);
  }
}
