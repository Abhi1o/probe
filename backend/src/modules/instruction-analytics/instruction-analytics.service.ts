import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface InstructionMethodRow {
  instructionName: string;
  instructionDiscriminator: string | null;
  callCount: number;
  callsPerMinute: number;
  callCountDelta: number;
  shareOfTotalCalls: number;
  successRate: number;
  errorRate: number;
  successCount: number;
  failureCount: number;
  successRateDelta: number;
  avgComputeUnits: number;
  p50ComputeUnits: number;
  p95ComputeUnits: number;
  p99ComputeUnits: number;
  computeBudgetUtilizationPct: number;
  topError: { code: string; name: string; count: number; percentage: number } | null;
  status: 'healthy' | 'degraded' | 'critical' | 'no_data';
  callSparkline: number[];
  errorRateSparkline: number[];
}

export interface InstructionCommandCenter {
  programId: string;
  windowHours: number;
  generatedAt: Date;
  topLine: {
    totalCalls: number;
    overallSuccessRate: number;
    overallErrorRate: number;
    avgComputeUnits: number;
    uniqueCallers: number;
  };
  instructions: InstructionMethodRow[];
  criticalInstructions: string[];
  degradedInstructions: string[];
}

export interface ErrorBreakdownRow {
  errorCode: string;
  errorName: string;
  errorMessage: string;
  errorCategory: string;
  count: number;
  percentage: number;
  percentageOfTotalCalls: number;
  uniqueWalletsAffected: number;
  firstSeen: Date;
  lastSeen: Date;
  isNew: boolean;
  trend: string;
  trendPct: number;
  hourlyTrend: number[];
}

@Injectable()
export class InstructionAnalyticsService {
  private readonly logger = new Logger(InstructionAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Command Center: all instructions as method rows ──────────────────────
  async getCommandCenter(
    programId: string,
    windowHours = 24,
  ): Promise<InstructionCommandCenter> {
    const since = new Date(Date.now() - windowHours * 3600000);
    const prevSince = new Date(Date.now() - windowHours * 2 * 3600000);

    try {
      const [instructionStats, prevStats, topErrors, sparklines, uniqueCallers] =
        await Promise.all([
          this.prisma.$queryRaw<any[]>`
            SELECT
              COALESCE("instructionName", 'unknown') as "instructionName",
              "instructionDiscriminator",
              COUNT(*)::int                                                    AS call_count,
              COUNT(*) FILTER (WHERE success = true)::int                     AS success_count,
              COUNT(*) FILTER (WHERE success = false)::int                    AS failure_count,
              ROUND(AVG(CASE WHEN success = true THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS success_rate,
              ROUND(AVG(CASE WHEN success = false THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS error_rate,
              ROUND(AVG("computeUnitsUsed")::numeric, 0)::int                AS avg_cu,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "computeUnitsUsed")::int AS p50_cu,
              PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "computeUnitsUsed")::int AS p95_cu,
              PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "computeUnitsUsed")::int AS p99_cu
            FROM instruction_call_records
            WHERE "programId" = ${programId}
              AND timestamp >= ${since}
            GROUP BY "instructionName", "instructionDiscriminator"
            ORDER BY call_count DESC
          `,
          this.prisma.$queryRaw<any[]>`
            SELECT
              COALESCE("instructionName", 'unknown') as "instructionName",
              COUNT(*)::int AS call_count,
              ROUND(AVG(CASE WHEN success = true THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS success_rate
            FROM instruction_call_records
            WHERE "programId" = ${programId}
              AND timestamp >= ${prevSince}
              AND timestamp < ${since}
            GROUP BY "instructionName"
          `,
          this.prisma.$queryRaw<any[]>`
            SELECT DISTINCT ON ("instructionName")
              COALESCE("instructionName", 'unknown') as "instructionName",
              "errorCode",
              "errorName",
              COUNT(*)::int AS error_count
            FROM instruction_call_records
            WHERE "programId" = ${programId}
              AND timestamp >= ${since}
              AND success = false
              AND "errorCode" IS NOT NULL
            GROUP BY "instructionName", "errorCode", "errorName"
            ORDER BY "instructionName", error_count DESC
          `,
          this.prisma.$queryRaw<any[]>`
            SELECT
              COALESCE("instructionName", 'unknown') as "instructionName",
              DATE_TRUNC('hour', timestamp) AS bucket,
              COUNT(*)::int AS calls,
              ROUND(AVG(CASE WHEN success = false THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS error_rate
            FROM instruction_call_records
            WHERE "programId" = ${programId}
              AND timestamp >= NOW() - INTERVAL '24 hours'
            GROUP BY "instructionName", bucket
            ORDER BY "instructionName", bucket
          `,
          this.prisma.$queryRaw<any[]>`
            SELECT COUNT(DISTINCT "callerWallet")::int AS unique_callers
            FROM instruction_call_records
            WHERE "programId" = ${programId}
              AND timestamp >= ${since}
              AND "callerWallet" IS NOT NULL
          `,
        ]);

      const prevMap = new Map(prevStats.map((p: any) => [p.instructionName, p]));
      const topErrorMap = new Map(topErrors.map((e: any) => [e.instructionName, e]));
      const sparklineMap = this.buildSparklineMap(sparklines);

      const totalCalls = instructionStats.reduce(
        (sum: number, s: any) => sum + Number(s.call_count),
        0,
      );

      const instructions: InstructionMethodRow[] = instructionStats.map((s: any) => {
        const prev = prevMap.get(s.instructionName) as any;
        const topError = topErrorMap.get(s.instructionName) as any;
        const sparks = sparklineMap.get(s.instructionName) || {
          calls: new Array(24).fill(0),
          errorRate: new Array(24).fill(0),
        };

        const errorRate = Number(s.error_rate ?? 0);
        const successRate = Number(s.success_rate ?? 0);
        const callCount = Number(s.call_count ?? 0);

        return {
          instructionName: s.instructionName,
          instructionDiscriminator: s.instructionDiscriminator,
          callCount,
          callsPerMinute: callCount / (windowHours * 60),
          callCountDelta: prev
            ? ((callCount - Number(prev.call_count)) / Math.max(Number(prev.call_count), 1)) * 100
            : 0,
          shareOfTotalCalls: totalCalls > 0 ? callCount / totalCalls : 0,
          successRate,
          errorRate,
          successCount: Number(s.success_count ?? 0),
          failureCount: Number(s.failure_count ?? 0),
          successRateDelta: prev ? (successRate - Number(prev.success_rate ?? 0)) * 100 : 0,
          avgComputeUnits: Number(s.avg_cu ?? 0),
          p50ComputeUnits: Number(s.p50_cu ?? 0),
          p95ComputeUnits: Number(s.p95_cu ?? 0),
          p99ComputeUnits: Number(s.p99_cu ?? 0),
          computeBudgetUtilizationPct: (Number(s.avg_cu ?? 0) / 1_400_000) * 100,
          topError: topError
            ? {
                code: topError.errorCode,
                name: topError.errorName || topError.errorCode,
                count: Number(topError.error_count),
                percentage:
                  Number(s.failure_count) > 0
                    ? Number(topError.error_count) / Number(s.failure_count)
                    : 0,
              }
            : null,
          status:
            errorRate > 0.1
              ? 'critical'
              : errorRate > 0.05
              ? 'degraded'
              : callCount === 0
              ? 'no_data'
              : 'healthy',
          callSparkline: sparks.calls,
          errorRateSparkline: sparks.errorRate,
        };
      });

      const totalSuccess = instructions.reduce((s, i) => s + i.successCount, 0);
      const totalFailures = instructions.reduce((s, i) => s + i.failureCount, 0);
      const weightedCU =
        totalCalls > 0
          ? instructions.reduce((s, i) => s + i.avgComputeUnits * i.callCount, 0) / totalCalls
          : 0;

      return {
        programId,
        windowHours,
        generatedAt: new Date(),
        topLine: {
          totalCalls,
          overallSuccessRate: totalCalls > 0 ? totalSuccess / totalCalls : 1,
          overallErrorRate: totalCalls > 0 ? totalFailures / totalCalls : 0,
          avgComputeUnits: Math.round(weightedCU),
          uniqueCallers: Number((uniqueCallers[0] as any)?.unique_callers ?? 0),
        },
        instructions,
        criticalInstructions: instructions
          .filter((i) => i.status === 'critical')
          .map((i) => i.instructionName),
        degradedInstructions: instructions
          .filter((i) => i.status === 'degraded')
          .map((i) => i.instructionName),
      };
    } catch (error) {
      this.logger.error('Error fetching instruction command center:', error);
      return {
        programId,
        windowHours,
        generatedAt: new Date(),
        topLine: {
          totalCalls: 0,
          overallSuccessRate: 1,
          overallErrorRate: 0,
          avgComputeUnits: 0,
          uniqueCallers: 0,
        },
        instructions: [],
        criticalInstructions: [],
        degradedInstructions: [],
      };
    }
  }

  // ── Per-instruction error breakdown ──────────────────────────────────────
  async getErrorBreakdown(
    programId: string,
    instructionName: string,
    windowHours = 24,
  ) {
    const since = new Date(Date.now() - windowHours * 3600000);
    const prevSince = new Date(Date.now() - windowHours * 2 * 3600000);

    try {
      const [errors, totals, prevErrors, hourlyErrors] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT
            "errorCode",
            COALESCE("errorName", "errorCode") as "errorName",
            COALESCE("errorMessage", '') as "errorMessage",
            COALESCE("errorCategory", 'unknown') as "errorCategory",
            COUNT(*)::int AS error_count,
            COUNT(DISTINCT "callerWallet")::int AS unique_wallets,
            MIN(timestamp) AS first_seen,
            MAX(timestamp) AS last_seen
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND success = false
            AND timestamp >= ${since}
            AND "errorCode" IS NOT NULL
          GROUP BY "errorCode", "errorName", "errorMessage", "errorCategory"
          ORDER BY error_count DESC
          LIMIT 20
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE success = false)::int AS failures,
            COUNT(DISTINCT "callerWallet")::int AS unique_callers,
            COUNT(DISTINCT "callerWallet") FILTER (WHERE success = false)::int AS unique_affected
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND timestamp >= ${since}
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT "errorCode", COUNT(*)::int AS count
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND success = false
            AND timestamp >= ${prevSince}
            AND timestamp < ${since}
          GROUP BY "errorCode"
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT
            "errorCode",
            DATE_TRUNC('hour', timestamp) AS bucket,
            COUNT(*)::int AS count
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND success = false
            AND timestamp >= NOW() - INTERVAL '24 hours'
            AND "errorCode" IS NOT NULL
          GROUP BY "errorCode", bucket
          ORDER BY "errorCode", bucket
        `,
      ]);

      const t = totals[0] || {};
      const totalCalls = Number(t.total ?? 0);
      const totalFailures = Number(t.failures ?? 0);
      const prevErrorMap = new Map(prevErrors.map((e: any) => [e.errorCode, Number(e.count)]));
      const hourlyMap = this.buildHourlyErrorMap(hourlyErrors);

      const errorRows: ErrorBreakdownRow[] = errors.map((e: any) => {
        const count = Number(e.error_count);
        const prevCount = prevErrorMap.get(e.errorCode) || 0;
        const trendPct = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 0;
        const isNew = new Date(e.first_seen) >= since;

        return {
          errorCode: e.errorCode,
          errorName: e.errorName || e.errorCode,
          errorMessage: e.errorMessage || '',
          errorCategory: e.errorCategory || 'unknown',
          count,
          percentage: totalFailures > 0 ? count / totalFailures : 0,
          percentageOfTotalCalls: totalCalls > 0 ? count / totalCalls : 0,
          uniqueWalletsAffected: Number(e.unique_wallets ?? 0),
          firstSeen: e.first_seen,
          lastSeen: e.last_seen,
          isNew,
          trend: isNew
            ? 'new'
            : trendPct > 10
            ? 'increasing'
            : trendPct < -10
            ? 'decreasing'
            : 'stable',
          trendPct,
          hourlyTrend: hourlyMap.get(e.errorCode) || new Array(24).fill(0),
        };
      });

      return {
        instructionName,
        windowHours,
        totalCalls,
        totalFailures,
        overallErrorRate: totalCalls > 0 ? totalFailures / totalCalls : 0,
        errors: errorRows,
        uniqueUsersAffected: Number(t.unique_affected ?? 0),
        percentOfUsersAffected:
          Number(t.unique_callers ?? 0) > 0
            ? Number(t.unique_affected ?? 0) / Number(t.unique_callers ?? 0)
            : 0,
      };
    } catch (error) {
      this.logger.error('Error fetching error breakdown:', error);
      return {
        instructionName,
        windowHours,
        totalCalls: 0,
        totalFailures: 0,
        overallErrorRate: 0,
        errors: [],
        uniqueUsersAffected: 0,
        percentOfUsersAffected: 0,
      };
    }
  }

  // ── Per-instruction usage analytics ──────────────────────────────────────
  async getInstructionUsage(
    programId: string,
    instructionName: string,
    windowHours = 24,
  ) {
    const since = new Date(Date.now() - windowHours * 3600000);

    try {
      const [stats, hourlyTrend, topCallers] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE success = true)::int AS success_count,
            COUNT(*) FILTER (WHERE success = false)::int AS failure_count,
            ROUND(AVG(CASE WHEN success = true THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS success_rate,
            ROUND(AVG("computeUnitsUsed")::numeric, 0)::int AS avg_cu,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "computeUnitsUsed")::int AS p50_cu,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "computeUnitsUsed")::int AS p95_cu,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "computeUnitsUsed")::int AS p99_cu,
            MAX("computeUnitsUsed")::int AS max_cu,
            COUNT(DISTINCT "callerWallet")::int AS unique_callers,
            AVG("feeLamports")::float AS avg_fee
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND timestamp >= ${since}
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT
            DATE_TRUNC('hour', timestamp) AS bucket,
            COUNT(*)::int AS calls,
            COUNT(*) FILTER (WHERE success = false)::int AS failures,
            ROUND(AVG("computeUnitsUsed")::numeric, 0)::int AS avg_cu
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND timestamp >= ${since}
          GROUP BY bucket
          ORDER BY bucket ASC
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT
            "callerWallet",
            COUNT(*)::int AS call_count,
            COUNT(*) FILTER (WHERE success = true)::int AS success_count,
            ROUND(AVG(CASE WHEN success = true THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS success_rate,
            ROUND(AVG("computeUnitsUsed")::numeric, 0)::int AS avg_cu
          FROM instruction_call_records
          WHERE "programId" = ${programId}
            AND "instructionName" = ${instructionName}
            AND timestamp >= ${since}
            AND "callerWallet" IS NOT NULL
          GROUP BY "callerWallet"
          ORDER BY call_count DESC
          LIMIT 10
        `,
      ]);

      const s = stats[0] || {};

      return {
        instructionName,
        windowHours,
        totalCalls: Number(s.total ?? 0),
        successCount: Number(s.success_count ?? 0),
        failureCount: Number(s.failure_count ?? 0),
        successRate: Number(s.success_rate ?? 0),
        avgComputeUnits: Number(s.avg_cu ?? 0),
        p50ComputeUnits: Number(s.p50_cu ?? 0),
        p95ComputeUnits: Number(s.p95_cu ?? 0),
        p99ComputeUnits: Number(s.p99_cu ?? 0),
        maxComputeUnits: Number(s.max_cu ?? 0),
        computeBudgetUtilizationPct: (Number(s.avg_cu ?? 0) / 1_400_000) * 100,
        uniqueCallers: Number(s.unique_callers ?? 0),
        avgFeeLamports: Number(s.avg_fee ?? 0),
        hourlyTrend: hourlyTrend.map((h: any) => ({
          bucket: h.bucket,
          calls: Number(h.calls ?? 0),
          failures: Number(h.failures ?? 0),
          avgCu: Number(h.avg_cu ?? 0),
          errorRate:
            Number(h.calls ?? 0) > 0 ? Number(h.failures ?? 0) / Number(h.calls ?? 0) : 0,
        })),
        topCallers: topCallers.map((c: any) => ({
          walletAddress: c.callerWallet,
          callCount: Number(c.call_count ?? 0),
          successCount: Number(c.success_count ?? 0),
          successRate: Number(c.success_rate ?? 0),
          avgComputeUnits: Number(c.avg_cu ?? 0),
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching instruction usage:', error);
      return null;
    }
  }

  // ── Leaderboard: most called / most failing / most expensive ─────────────
  async getLeaderboard(
    programId: string,
    metric: 'calls' | 'errors' | 'error_rate' | 'compute' | 'callers' = 'calls',
    windowHours = 24,
    limit = 10,
  ) {
    const since = new Date(Date.now() - windowHours * 3600000);

    try {
      const orderBy =
        metric === 'calls'
          ? 'call_count DESC'
          : metric === 'errors'
          ? 'failure_count DESC'
          : metric === 'error_rate'
          ? 'error_rate DESC'
          : metric === 'compute'
          ? 'avg_cu DESC'
          : 'unique_callers DESC';

      const rows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE("instructionName", 'unknown') as "instructionName",
          COUNT(*)::int AS call_count,
          COUNT(*) FILTER (WHERE success = false)::int AS failure_count,
          ROUND(AVG(CASE WHEN success = false THEN 1.0 ELSE 0.0 END)::numeric, 4)::float AS error_rate,
          ROUND(AVG("computeUnitsUsed")::numeric, 0)::int AS avg_cu,
          COUNT(DISTINCT "callerWallet")::int AS unique_callers
        FROM instruction_call_records
        WHERE "programId" = $1
          AND timestamp >= $2
        GROUP BY "instructionName"
        ORDER BY ${orderBy}
        LIMIT $3
      `, programId, since, limit);

      return rows.map((r: any) => ({
        instructionName: r.instructionName,
        callCount: Number(r.call_count ?? 0),
        failureCount: Number(r.failure_count ?? 0),
        errorRate: Number(r.error_rate ?? 0),
        avgComputeUnits: Number(r.avg_cu ?? 0),
        uniqueCallers: Number(r.unique_callers ?? 0),
      }));
    } catch (error) {
      this.logger.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // ── Live log: recent instruction calls ───────────────────────────────────
  async getLiveLog(
    programId: string,
    options: {
      instructionName?: string;
      success?: boolean;
      errorCode?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const where: any = { programId };
    if (options.instructionName) where.instructionName = options.instructionName;
    if (options.success !== undefined) where.success = options.success;
    if (options.errorCode) where.errorCode = options.errorCode;

    try {
      const [records, total] = await Promise.all([
        this.prisma.instructionCallRecord.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: options.limit || 50,
          skip: options.offset || 0,
          select: {
            id: true,
            instructionName: true,
            instructionDiscriminator: true,
            signature: true,
            slot: true,
            blockTime: true,
            success: true,
            errorCode: true,
            errorName: true,
            errorMessage: true,
            errorCategory: true,
            computeUnitsUsed: true,
            feeLamports: true,
            callerWallet: true,
            cpiCount: true,
            timestamp: true,
          },
        }),
        this.prisma.instructionCallRecord.count({ where }),
      ]);

      return {
        data: records.map((r) => ({
          ...r,
          id: r.id.toString(),
          slot: r.slot.toString(),
          feeLamports: r.feeLamports?.toString() ?? null,
        })),
        total,
        limit: options.limit || 50,
        offset: options.offset || 0,
      };
    } catch (error) {
      this.logger.error('Error fetching live log:', error);
      return { data: [], total: 0, limit: 50, offset: 0 };
    }
  }

  // ── New errors: appeared for first time in window ────────────────────────
  async getNewErrors(programId: string, sinceHours = 24) {
    const since = new Date(Date.now() - sinceHours * 3600000);

    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT
          "instructionName",
          "errorCode",
          COALESCE("errorName", "errorCode") as "errorName",
          COUNT(*)::int AS count,
          MIN(timestamp) AS first_seen
        FROM instruction_call_records
        WHERE "programId" = ${programId}
          AND success = false
          AND "errorCode" IS NOT NULL
          AND timestamp >= ${since}
        GROUP BY "instructionName", "errorCode", "errorName"
        HAVING MIN(timestamp) >= ${since}
        ORDER BY first_seen DESC
        LIMIT 20
      `;

      return rows.map((r: any) => ({
        instructionName: r.instructionName,
        errorCode: r.errorCode,
        errorName: r.errorName,
        count: Number(r.count),
        firstSeen: r.first_seen,
      }));
    } catch (error) {
      this.logger.error('Error fetching new errors:', error);
      return [];
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private buildSparklineMap(
    rows: any[],
  ): Map<string, { calls: number[]; errorRate: number[] }> {
    const map = new Map<string, { calls: number[]; errorRate: number[] }>();
    for (const row of rows) {
      if (!map.has(row.instructionName)) {
        map.set(row.instructionName, {
          calls: new Array(24).fill(0),
          errorRate: new Array(24).fill(0),
        });
      }
      const hourIndex = Math.floor(
        (Date.now() - new Date(row.bucket).getTime()) / 3600000,
      );
      const slot = Math.max(0, Math.min(23, 23 - hourIndex));
      const entry = map.get(row.instructionName)!;
      entry.calls[slot] = Number(row.calls ?? 0);
      entry.errorRate[slot] = Number(row.error_rate ?? 0);
    }
    return map;
  }

  private buildHourlyErrorMap(rows: any[]): Map<string, number[]> {
    const map = new Map<string, number[]>();
    for (const row of rows) {
      if (!map.has(row.errorCode)) {
        map.set(row.errorCode, new Array(24).fill(0));
      }
      const hourIndex = Math.floor(
        (Date.now() - new Date(row.bucket).getTime()) / 3600000,
      );
      const slot = Math.max(0, Math.min(23, 23 - hourIndex));
      const arr = map.get(row.errorCode)!;
      arr[slot] = Number(row.count ?? 0);
    }
    return map;
  }
}
