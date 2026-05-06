import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface ProgramMetrics {
  tx_count: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_compute_units: number;
  avg_fee: number;
  median_compute_units: number;
  hour: Date;
}

export interface TrendData {
  date: Date;
  count: number;
  avg_compute: number;
  avg_fee: number;
  success_rate: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getProgramMetrics(programId: string, period: '1h' | '24h' | '7d' | '30d' = '24h') {
    const periodMap = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    };

    const hours = periodMap[period];
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const metrics = await this.prisma.$queryRaw<any[]>`
        SELECT
          DATE_TRUNC('hour', "blockTime") as timestamp,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failure_count,
          (COUNT(*) FILTER (WHERE status = 'SUCCESS')::float / NULLIF(COUNT(*), 0) * 100) as success_rate,
          AVG("computeUnits") as avg_compute_units,
          AVG(fee) as avg_fee
        FROM transactions
        WHERE "programId" = ${programId}
          AND "blockTime" >= ${startTime}
        GROUP BY DATE_TRUNC('hour', "blockTime")
        ORDER BY timestamp ASC
      `;

      return metrics.map((m) => ({
        timestamp: m.timestamp,
        count: Number(m.count),
        successCount: Number(m.success_count),
        failureCount: Number(m.failure_count),
        successRate: Number(m.success_rate ?? 0),
        avgComputeUnits: Number(m.avg_compute_units ?? 0),
        avgFee: Number(m.avg_fee ?? 0),
      }));
    } catch (error) {
      this.logger.error('Error fetching program metrics:', error);
      return [];
    }
  }

  async getTrends(programId: string, metric: string, period: '7d' | '30d' = '7d') {
    const days = period === '7d' ? 7 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const data = await this.prisma.$queryRaw<any[]>`
        SELECT
          DATE_TRUNC('day', "blockTime") as timestamp,
          COUNT(*) as count,
          AVG("computeUnits") as avg_compute,
          AVG(fee) as avg_fee,
          (COUNT(*) FILTER (WHERE status = 'SUCCESS')::float / NULLIF(COUNT(*), 0) * 100) as success_rate
        FROM transactions
        WHERE "programId" = ${programId}
          AND "blockTime" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "blockTime")
        ORDER BY timestamp ASC
      `;

      return data.map((d) => ({
        timestamp: d.timestamp,
        count: Number(d.count),
        avgCompute: Number(d.avg_compute ?? 0),
        avgFee: Number(d.avg_fee ?? 0),
        successRate: Number(d.success_rate ?? 0),
      }));
    } catch (error) {
      this.logger.error('Error fetching trends:', error);
      return [];
    }
  }

  async getTopPrograms(limit: number = 10) {
    try {
      // Get programs with transaction counts
      const programs = await this.prisma.$queryRaw<any[]>`
        SELECT
          p.id,
          p.name,
          p."programId",
          p.network,
          p."isActive",
          COUNT(t.id) as transaction_count,
          COUNT(t.id) FILTER (WHERE t.status = 'SUCCESS') as success_count,
          COUNT(t.id) FILTER (WHERE t.status = 'FAILED') as failure_count,
          AVG(t."computeUnits") as avg_compute_units,
          AVG(t.fee) as avg_fee
        FROM programs p
        LEFT JOIN transactions t ON t."programId" = p.id
        WHERE p."isActive" = true
        GROUP BY p.id, p.name, p."programId", p.network, p."isActive"
        ORDER BY transaction_count DESC
        LIMIT ${limit}
      `;

      // Transform to camelCase for frontend
      return programs.map(p => ({
        id: p.id,
        name: p.name,
        programId: p.programId,
        network: p.network,
        isActive: p.isActive,
        transactionCount: Number(p.transaction_count) || 0,
        successCount: Number(p.success_count) || 0,
        failureCount: Number(p.failure_count) || 0,
        successRate: p.transaction_count > 0 
          ? (Number(p.success_count) / Number(p.transaction_count)) * 100 
          : 0,
        avgComputeUnits: p.avg_compute_units ? Number(p.avg_compute_units) : null,
        avgFee: p.avg_fee ? Number(p.avg_fee) : null,
      }));
    } catch (error) {
      this.logger.error('Error fetching top programs:', error);
      return [];
    }
  }

  async getOverallStatistics() {
    try {
      const stats = await this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(DISTINCT p.id) as total_programs,
          COUNT(t.id) as total_transactions,
          COUNT(t.id) FILTER (WHERE t.status = 'SUCCESS') as total_success,
          COUNT(t.id) FILTER (WHERE t.status = 'FAILED') as total_failures,
          (COUNT(t.id) FILTER (WHERE t.status = 'SUCCESS')::float / NULLIF(COUNT(t.id), 0) * 100) as overall_success_rate,
          AVG(t."computeUnits") as avg_compute_units,
          AVG(t.fee) as avg_fee,
          SUM(t.fee) as total_fees
        FROM programs p
        LEFT JOIN transactions t ON t."programId" = p.id
        WHERE p."isActive" = true
      `;

      return stats[0] || {};
    } catch (error) {
      this.logger.error('Error fetching overall statistics:', error);
      return {};
    }
  }

  async getTransactionDistribution(programId: string, period: '24h' | '7d' | '30d' = '24h') {
    const periodMap = { '24h': 1, '7d': 7, '30d': 30 };
    const days = periodMap[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT
          status,
          COUNT(*) as count
        FROM transactions
        WHERE "programId" = ${programId}
          AND "blockTime" >= ${startDate}
        GROUP BY status
      `;

      const success = Number(rows.find(r => r.status === 'SUCCESS')?.count ?? 0);
      const failed = Number(rows.find(r => r.status === 'FAILED')?.count ?? 0);

      return { success, failed, total: success + failed };
    } catch (error) {
      this.logger.error('Error fetching transaction distribution:', error);
      return { success: 0, failed: 0, total: 0 };
    }
  }

  async getHourlyActivity(programId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const activity = await this.prisma.$queryRaw<any[]>`
        SELECT
          EXTRACT(HOUR FROM "blockTime") as hour,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failure_count
        FROM transactions
        WHERE "programId" = ${programId}
          AND "blockTime" >= ${startOfDay}
          AND "blockTime" <= ${endOfDay}
        GROUP BY EXTRACT(HOUR FROM "blockTime")
        ORDER BY hour ASC
      `;

      // Fill in missing hours with zero counts
      return Array.from({ length: 24 }, (_, i) => {
        const hourData = activity.find(a => Number(a.hour) === i);
        return {
          hour: i,
          timestamp: `${String(i).padStart(2, '0')}:00`,
          count: hourData ? Number(hourData.count) : 0,
          successCount: hourData ? Number(hourData.success_count) : 0,
          failureCount: hourData ? Number(hourData.failure_count) : 0,
        };
      });
    } catch (error) {
      this.logger.error('Error fetching hourly activity:', error);
      return [];
    }
  }

  async getComputeUnitsDistribution(programId: string, period: '24h' | '7d' | '30d' = '24h') {
    const periodMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
    };

    const days = periodMap[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const distribution = await this.prisma.$queryRaw<any[]>`
        SELECT
          CASE
            WHEN "computeUnits" < 10000 THEN '0-10k'
            WHEN "computeUnits" < 50000 THEN '10k-50k'
            WHEN "computeUnits" < 100000 THEN '50k-100k'
            WHEN "computeUnits" < 200000 THEN '100k-200k'
            ELSE '200k+'
          END as range,
          COUNT(*) as count
        FROM transactions
        WHERE "programId" = ${programId}
          AND "blockTime" >= ${startDate}
          AND "computeUnits" IS NOT NULL
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '0-10k' THEN 1
            WHEN '10k-50k' THEN 2
            WHEN '50k-100k' THEN 3
            WHEN '100k-200k' THEN 4
            WHEN '200k+' THEN 5
          END
      `;

      return distribution;
    } catch (error) {
      this.logger.error('Error fetching compute units distribution:', error);
      return [];
    }
  }

  async getPerformanceMetrics(programId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const [today, lastWeek] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            programId,
            blockTime: { gte: oneDayAgo },
          },
          _count: { _all: true },
          _avg: { computeUnits: true, fee: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            programId,
            blockTime: { gte: oneWeekAgo, lt: oneDayAgo },
          },
          _count: { _all: true },
          _avg: { computeUnits: true, fee: true },
        }),
      ]);

      const todayCount = today._count._all;
      const lastWeekCount = lastWeek._count._all;
      const countChange = lastWeekCount > 0 
        ? ((todayCount - lastWeekCount) / lastWeekCount) * 100 
        : 0;

      return {
        today: {
          count: todayCount,
          avgComputeUnits: today._avg.computeUnits || 0,
          avgFee: Number(today._avg.fee) || 0,
        },
        lastWeek: {
          count: lastWeekCount,
          avgComputeUnits: lastWeek._avg.computeUnits || 0,
          avgFee: Number(lastWeek._avg.fee) || 0,
        },
        change: {
          count: countChange,
          avgComputeUnits: lastWeek._avg.computeUnits 
            ? ((today._avg.computeUnits || 0) - (lastWeek._avg.computeUnits || 0)) / (lastWeek._avg.computeUnits || 1) * 100
            : 0,
          avgFee: lastWeek._avg.fee
            ? ((Number(today._avg.fee) || 0) - (Number(lastWeek._avg.fee) || 0)) / (Number(lastWeek._avg.fee) || 1) * 100
            : 0,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching performance metrics:', error);
      return null;
    }
  }

  // ── Top Signers (unique callers) ──────────────────────────────────────────
  async getTopSigners(programId: string, period: '24h' | '7d' | '30d' = '7d', limit = 10) {
    const days = { '24h': 1, '7d': 7, '30d': 30 }[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT signer, COUNT(*) as tx_count,
          COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failure_count,
          SUM(fee) as total_fees, AVG("computeUnits") as avg_compute
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
          AND signer IS NOT NULL AND signer != ''
        GROUP BY signer ORDER BY tx_count DESC LIMIT ${limit}
      `;
      return rows.map(r => ({
        signer: r.signer, txCount: Number(r.tx_count),
        successCount: Number(r.success_count), failureCount: Number(r.failure_count),
        totalFees: Number(r.total_fees), avgCompute: Number(r.avg_compute ?? 0),
        successRate: Number(r.tx_count) > 0 ? ((Number(r.success_count) / Number(r.tx_count)) * 100).toFixed(1) : '0',
      }));
    } catch (e) { this.logger.error('getTopSigners:', e); return []; }
  }

  // ── Fee Analysis ──────────────────────────────────────────────────────────
  async getFeeAnalysis(programId: string, period: '24h' | '7d' | '30d' = '7d') {
    const days = { '24h': 1, '7d': 7, '30d': 30 }[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    try {
      const [stats, buckets] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT MIN(fee) as min_fee, MAX(fee) as max_fee, AVG(fee) as avg_fee,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fee) as median_fee,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY fee) as p95_fee,
            SUM(fee) as total_fees, COUNT(*) as tx_count
          FROM transactions WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT CASE WHEN fee < 5000 THEN '< 5k' WHEN fee < 10000 THEN '5k-10k'
            WHEN fee < 25000 THEN '10k-25k' WHEN fee < 100000 THEN '25k-100k' ELSE '100k+' END as bucket,
            COUNT(*) as count FROM transactions
          WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
          GROUP BY bucket ORDER BY MIN(fee)
        `,
      ]);
      const s = stats[0] || {};
      return {
        minFee: Number(s.min_fee ?? 0), maxFee: Number(s.max_fee ?? 0),
        avgFee: Number(s.avg_fee ?? 0), medianFee: Number(s.median_fee ?? 0),
        p95Fee: Number(s.p95_fee ?? 0), totalFees: Number(s.total_fees ?? 0),
        txCount: Number(s.tx_count ?? 0),
        distribution: buckets.map(b => ({ bucket: b.bucket, count: Number(b.count) })),
      };
    } catch (e) { this.logger.error('getFeeAnalysis:', e); return null; }
  }

  // ── Compute Unit Efficiency ───────────────────────────────────────────────
  async getComputeEfficiency(programId: string, period: '24h' | '7d' | '30d' = '7d') {
    const days = { '24h': 1, '7d': 7, '30d': 30 }[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    try {
      const [stats, buckets] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT MIN("computeUnits") as min_cu, MAX("computeUnits") as max_cu,
            AVG("computeUnits") as avg_cu,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "computeUnits") as median_cu,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "computeUnits") as p95_cu,
            SUM("computeUnits") as total_cu, COUNT(*) as tx_count
          FROM transactions WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
            AND "computeUnits" IS NOT NULL
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT CASE WHEN "computeUnits" < 10000 THEN '0-10k' WHEN "computeUnits" < 50000 THEN '10k-50k'
            WHEN "computeUnits" < 100000 THEN '50k-100k' WHEN "computeUnits" < 200000 THEN '100k-200k'
            WHEN "computeUnits" < 400000 THEN '200k-400k' ELSE '400k+' END as bucket,
            COUNT(*) as count, AVG("computeUnits") as avg_cu
          FROM transactions WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
            AND "computeUnits" IS NOT NULL
          GROUP BY bucket ORDER BY MIN("computeUnits")
        `,
      ]);
      const s = stats[0] || {};
      return {
        minCu: Number(s.min_cu ?? 0), maxCu: Number(s.max_cu ?? 0),
        avgCu: Number(s.avg_cu ?? 0), medianCu: Number(s.median_cu ?? 0),
        p95Cu: Number(s.p95_cu ?? 0), totalCu: Number(s.total_cu ?? 0),
        txCount: Number(s.tx_count ?? 0),
        avgUtilization: Number(s.avg_cu ?? 0) / 1400000 * 100,
        distribution: buckets.map(b => ({ bucket: b.bucket, count: Number(b.count), avgCu: Number(b.avg_cu ?? 0) })),
      };
    } catch (e) { this.logger.error('getComputeEfficiency:', e); return null; }
  }

  // ── Error Breakdown ───────────────────────────────────────────────────────
  async getErrorBreakdown(programId: string, period: '24h' | '7d' | '30d' = '7d') {
    const days = { '24h': 1, '7d': 7, '30d': 30 }[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(error, 'Unknown Error') as error_type, COUNT(*) as count
        FROM transactions WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
          AND status = 'FAILED'
        GROUP BY error_type ORDER BY count DESC LIMIT 10
      `;
      return rows.map(r => ({ errorType: r.error_type, count: Number(r.count) }));
    } catch (e) { this.logger.error('getErrorBreakdown:', e); return []; }
  }

  // ── Unique Users Over Time ────────────────────────────────────────────────
  async getUniqueUsersOverTime(programId: string, period: '7d' | '30d' = '7d') {
    const days = period === '7d' ? 7 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT DATE_TRUNC('day', "blockTime") as date,
          COUNT(DISTINCT signer) as unique_users, COUNT(*) as tx_count
        FROM transactions WHERE "programId" = ${programId} AND "blockTime" >= ${startDate}
          AND signer IS NOT NULL
        GROUP BY DATE_TRUNC('day', "blockTime") ORDER BY date ASC
      `;
      return rows.map(r => ({ date: r.date, uniqueUsers: Number(r.unique_users), txCount: Number(r.tx_count) }));
    } catch (e) { this.logger.error('getUniqueUsers:', e); return []; }
  }

  // ── Summary Stats ─────────────────────────────────────────────────────────
  async getSummaryStats(programId: string) {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
      const [last24h, prev24h, last7d, allTime, uniqueSigners, successLast24h, successAll] = await Promise.all([
        this.prisma.transaction.aggregate({ where: { programId, blockTime: { gte: h24 } }, _count: { _all: true }, _avg: { computeUnits: true, fee: true } }),
        this.prisma.transaction.aggregate({ where: { programId, blockTime: { gte: h48, lt: h24 } }, _count: { _all: true } }),
        this.prisma.transaction.aggregate({ where: { programId, blockTime: { gte: d7 } }, _count: { _all: true } }),
        this.prisma.transaction.aggregate({ where: { programId }, _count: { _all: true }, _sum: { fee: true } }),
        this.prisma.$queryRaw<any[]>`SELECT COUNT(DISTINCT signer) as unique_signers FROM transactions WHERE "programId" = ${programId} AND signer IS NOT NULL`,
        this.prisma.transaction.count({ where: { programId, blockTime: { gte: h24 }, status: 'SUCCESS' } }),
        this.prisma.transaction.count({ where: { programId, status: 'SUCCESS' } }),
      ]);
      const total24h = last24h._count._all;
      const totalAll = allTime._count._all;
      const prev24hCount = prev24h._count._all;
      const change24h = prev24hCount > 0 ? ((total24h - prev24hCount) / prev24hCount * 100).toFixed(1) : '0';
      return {
        last24h: { txCount: total24h, successRate: total24h > 0 ? ((successLast24h / total24h) * 100).toFixed(1) : '0', avgComputeUnits: Number(last24h._avg.computeUnits ?? 0), avgFee: Number(last24h._avg.fee ?? 0), change: change24h },
        last7d: { txCount: last7d._count._all },
        allTime: { txCount: totalAll, successRate: totalAll > 0 ? ((successAll / totalAll) * 100).toFixed(1) : '0', totalFees: Number(allTime._sum.fee ?? 0), uniqueSigners: Number((uniqueSigners[0] as any)?.unique_signers ?? 0) },
      };
    } catch (e) { this.logger.error('getSummaryStats:', e); return null; }
  }
}
