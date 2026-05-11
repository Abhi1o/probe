import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

export interface HealthScoreResult {
  programId: string;
  programName: string;
  score: number;
  grade: string;
  trend: string;
  components: {
    reliability: { score: number; label: string; detail: string };
    performance: { score: number; label: string; detail: string };
    activity: { score: number; label: string; detail: string };
    errors: { score: number; label: string; detail: string };
    users: { score: number; label: string; detail: string };
  };
  metrics: {
    successRate24h: number;
    successRate7d: number;
    avgComputeUnits24h: number;
    errorRate24h: number;
    txCount24h: number;
    txCount7d: number;
    uniqueUsers24h: number;
    uniqueUsers7d: number;
    topErrorCode: string | null;
    topErrorCount: number;
  };
  strengths: string[];
  warnings: string[];
  recommendations: string[];
  computedAt: Date;
}

function gradeFromScore(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: PrismaService) {}

  async getReadiness() {
    const database = await this.prisma.isHealthy();

    return {
      status: database ? 'ok' : 'degraded',
      service: 'probe-backend',
      database,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Compute health score for a single program ─────────────────────────────
  async computeHealthScore(programId: string): Promise<HealthScoreResult> {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 3600000);
    const h48 = new Date(now.getTime() - 48 * 3600000);
    const d7 = new Date(now.getTime() - 7 * 24 * 3600000);
    const d14 = new Date(now.getTime() - 14 * 24 * 3600000);

    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { name: true },
    });

    // ── Fetch raw metrics in parallel ──────────────────────────────────────
    const [
      stats24h, stats48h, stats7d, stats14d,
      topError24h, uniqueUsers24h, uniqueUsers7d,
    ] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS ok,
          COUNT(*) FILTER (WHERE status = 'FAILED')::int AS fail,
          AVG("computeUnits")::float AS avg_cu,
          MAX("computeUnits")::int AS max_cu
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${h24}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS ok
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${h48} AND "blockTime" < ${h24}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS ok,
          AVG("computeUnits")::float AS avg_cu
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${d7}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS ok
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${d14} AND "blockTime" < ${d7}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT error, COUNT(*)::int AS cnt
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${h24}
          AND status = 'FAILED' AND error IS NOT NULL
        GROUP BY error ORDER BY cnt DESC LIMIT 1
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT signer)::int AS cnt
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${h24}
          AND signer IS NOT NULL AND signer != ''
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT signer)::int AS cnt
        FROM transactions
        WHERE "programId" = ${programId} AND "blockTime" >= ${d7}
          AND signer IS NOT NULL AND signer != ''
      `,
    ]);

    const s24 = stats24h[0] || {};
    const s48 = stats48h[0] || {};
    const s7 = stats7d[0] || {};
    const s14 = stats14d[0] || {};

    const total24h = Number(s24.total ?? 0);
    const ok24h = Number(s24.ok ?? 0);
    const fail24h = Number(s24.fail ?? 0);
    const avgCu24h = Number(s24.avg_cu ?? 0);
    const maxCu24h = Number(s24.max_cu ?? 0);

    const total48h = Number(s48.total ?? 0);
    const ok48h = Number(s48.ok ?? 0);

    const total7d = Number(s7.total ?? 0);
    const ok7d = Number(s7.ok ?? 0);
    const avgCu7d = Number(s7.avg_cu ?? 0);

    const total14d = Number(s14.total ?? 0);
    const ok14d = Number(s14.ok ?? 0);

    const successRate24h = total24h > 0 ? ok24h / total24h : 1;
    const successRate7d = total7d > 0 ? ok7d / total7d : 1;
    const errorRate24h = total24h > 0 ? fail24h / total24h : 0;

    const prevSuccessRate = total48h > 0 ? ok48h / total48h : successRate24h;
    const prevTxCount = total14d;

    const uniqueUsers24hCount = Number((uniqueUsers24h[0] as any)?.cnt ?? 0);
    const uniqueUsers7dCount = Number((uniqueUsers7d[0] as any)?.cnt ?? 0);

    const topErr = topError24h[0];
    const topErrorCode = topErr?.error ?? null;
    const topErrorCount = Number(topErr?.cnt ?? 0);

    // ── Score each dimension ───────────────────────────────────────────────

    // 1. RELIABILITY (0-100): Based on success rate
    // 100% success = 100, 95% = 80, 90% = 60, 80% = 30, <70% = 0
    const reliabilityScore = Math.round(
      successRate24h >= 1.0 ? 100
      : successRate24h >= 0.99 ? 95
      : successRate24h >= 0.97 ? 85
      : successRate24h >= 0.95 ? 75
      : successRate24h >= 0.90 ? 55
      : successRate24h >= 0.80 ? 30
      : successRate24h >= 0.70 ? 15
      : 5
    );

    // 2. PERFORMANCE (0-100): Based on compute unit efficiency
    // <10% of budget = 100, <30% = 85, <50% = 70, <70% = 50, <90% = 25, >90% = 5
    const cuUtilization = avgCu24h / 1_400_000;
    const performanceScore = Math.round(
      cuUtilization <= 0.10 ? 100
      : cuUtilization <= 0.20 ? 92
      : cuUtilization <= 0.30 ? 85
      : cuUtilization <= 0.50 ? 70
      : cuUtilization <= 0.70 ? 50
      : cuUtilization <= 0.90 ? 25
      : 10
    );

    // 3. ACTIVITY (0-100): Based on transaction volume and trend
    // Healthy = has transactions + growing or stable
    const activityBase = total24h > 0
      ? Math.min(100, Math.round(Math.log10(total24h + 1) * 25))
      : 0;
    const txTrend = total14d > 0 ? (total7d - total14d) / total14d : 0;
    const activityTrendBonus = txTrend > 0.1 ? 10 : txTrend < -0.3 ? -15 : 0;
    const activityScore = Math.max(0, Math.min(100, activityBase + activityTrendBonus));

    // 4. ERROR SCORE (0-100): Based on error rate and diversity
    // 0% errors = 100, <1% = 90, <3% = 75, <5% = 55, <10% = 30, >10% = 10
    const errorScore = Math.round(
      errorRate24h === 0 ? 100
      : errorRate24h <= 0.01 ? 90
      : errorRate24h <= 0.03 ? 75
      : errorRate24h <= 0.05 ? 55
      : errorRate24h <= 0.10 ? 30
      : errorRate24h <= 0.20 ? 15
      : 5
    );

    // 5. USER SCORE (0-100): Based on unique users and retention
    const userBase = uniqueUsers24hCount > 0
      ? Math.min(100, Math.round(Math.log10(uniqueUsers24hCount + 1) * 30))
      : 0;
    const retentionBonus = uniqueUsers7dCount > 0 && uniqueUsers24hCount > 0
      ? Math.min(20, Math.round((uniqueUsers24hCount / uniqueUsers7dCount) * 20))
      : 0;
    const userScore = Math.min(100, userBase + retentionBonus);

    // ── Weighted overall score ─────────────────────────────────────────────
    // Reliability is most important (35%), then errors (25%), performance (20%), activity (10%), users (10%)
    const overallScore = Math.round(
      reliabilityScore * 0.35 +
      errorScore * 0.25 +
      performanceScore * 0.20 +
      activityScore * 0.10 +
      userScore * 0.10
    );

    // ── Trend ─────────────────────────────────────────────────────────────
    const successRateDelta = successRate24h - prevSuccessRate;
    const trend =
      successRateDelta > 0.02 ? 'improving'
      : successRateDelta < -0.02 ? 'declining'
      : 'stable';

    // ── Strengths, warnings, recommendations ──────────────────────────────
    const strengths: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (successRate24h >= 0.99) strengths.push('Excellent success rate (≥99%)');
    if (successRate24h >= 0.97 && successRate24h < 0.99) strengths.push('High success rate (≥97%)');
    if (cuUtilization <= 0.20) strengths.push('Very efficient compute usage (<20% of budget)');
    if (cuUtilization <= 0.30) strengths.push('Efficient compute usage (<30% of budget)');
    if (total24h > 1000) strengths.push(`High activity: ${total24h.toLocaleString()} transactions today`);
    if (uniqueUsers24hCount > 100) strengths.push(`Strong user base: ${uniqueUsers24hCount} unique wallets today`);
    if (txTrend > 0.1) strengths.push(`Growing: +${(txTrend * 100).toFixed(0)}% transactions vs last week`);

    if (errorRate24h > 0.05) warnings.push(`High error rate: ${(errorRate24h * 100).toFixed(1)}% of transactions failing`);
    if (errorRate24h > 0.01 && errorRate24h <= 0.05) warnings.push(`Elevated error rate: ${(errorRate24h * 100).toFixed(1)}% failures`);
    if (cuUtilization > 0.70) warnings.push(`High compute usage: ${(cuUtilization * 100).toFixed(0)}% of 1.4M budget`);
    if (successRateDelta < -0.02) warnings.push(`Success rate declining: ${(successRateDelta * 100).toFixed(1)}pp vs yesterday`);
    if (txTrend < -0.3) warnings.push(`Activity dropping: ${(txTrend * 100).toFixed(0)}% fewer transactions vs last week`);
    if (total24h === 0) warnings.push('No transactions in the last 24 hours');
    if (topErrorCode && topErrorCount > 10) warnings.push(`Top error "${topErrorCode}" fired ${topErrorCount} times today`);

    if (errorRate24h > 0.03) recommendations.push('Review failed transactions to identify root causes');
    if (cuUtilization > 0.50) recommendations.push('Optimize compute-heavy instructions to reduce user costs');
    if (total24h === 0) recommendations.push('Check if the program is still active and indexer is running');
    if (uniqueUsers24hCount < 5 && total24h > 0) recommendations.push('Low unique users — consider if bots are dominating activity');
    if (successRate24h < 0.95) recommendations.push('Investigate error patterns in the Errors tab');

    const result: HealthScoreResult = {
      programId,
      programName: program?.name ?? 'Unknown',
      score: overallScore,
      grade: gradeFromScore(overallScore),
      trend,
      components: {
        reliability: {
          score: reliabilityScore,
          label: reliabilityScore >= 90 ? 'Excellent' : reliabilityScore >= 70 ? 'Good' : reliabilityScore >= 50 ? 'Fair' : 'Poor',
          detail: `${(successRate24h * 100).toFixed(1)}% success rate (24h)`,
        },
        performance: {
          score: performanceScore,
          label: performanceScore >= 90 ? 'Excellent' : performanceScore >= 70 ? 'Good' : performanceScore >= 50 ? 'Fair' : 'Poor',
          detail: `${avgCu24h > 0 ? Math.round(avgCu24h).toLocaleString() : 'N/A'} avg CU (${(cuUtilization * 100).toFixed(1)}% of budget)`,
        },
        activity: {
          score: activityScore,
          label: activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Moderate' : activityScore > 0 ? 'Low' : 'Inactive',
          detail: `${total24h.toLocaleString()} transactions today`,
        },
        errors: {
          score: errorScore,
          label: errorScore >= 90 ? 'Clean' : errorScore >= 70 ? 'Minor' : errorScore >= 50 ? 'Moderate' : 'High',
          detail: `${(errorRate24h * 100).toFixed(1)}% error rate (24h)`,
        },
        users: {
          score: userScore,
          label: userScore >= 70 ? 'Strong' : userScore >= 40 ? 'Moderate' : userScore > 0 ? 'Low' : 'None',
          detail: `${uniqueUsers24hCount} unique wallets today`,
        },
      },
      metrics: {
        successRate24h,
        successRate7d,
        avgComputeUnits24h: avgCu24h,
        errorRate24h,
        txCount24h: total24h,
        txCount7d: total7d,
        uniqueUsers24h: uniqueUsers24hCount,
        uniqueUsers7d: uniqueUsers7dCount,
        topErrorCode,
        topErrorCount,
      },
      strengths,
      warnings,
      recommendations,
      computedAt: now,
    };

    // ── Persist to DB ──────────────────────────────────────────────────────
    await this.prisma.programHealthScore.upsert({
      where: { programId },
      create: {
        programId,
        score: overallScore,
        grade: gradeFromScore(overallScore),
        trend,
        reliabilityScore,
        performanceScore,
        activityScore,
        errorScore,
        userScore,
        successRate24h,
        successRate7d,
        avgComputeUnits24h: avgCu24h,
        errorRate24h,
        txCount24h: total24h,
        txCount7d: total7d,
        uniqueUsers24h: uniqueUsers24hCount,
        uniqueUsers7d: uniqueUsers7dCount,
        topErrorCode,
        topErrorCount,
        strengths,
        warnings,
        recommendations,
      },
      update: {
        score: overallScore,
        grade: gradeFromScore(overallScore),
        trend,
        reliabilityScore,
        performanceScore,
        activityScore,
        errorScore,
        userScore,
        successRate24h,
        successRate7d,
        avgComputeUnits24h: avgCu24h,
        errorRate24h,
        txCount24h: total24h,
        txCount7d: total7d,
        uniqueUsers24h: uniqueUsers24hCount,
        uniqueUsers7d: uniqueUsers7dCount,
        topErrorCode,
        topErrorCount,
        strengths,
        warnings,
        recommendations,
        computedAt: now,
      },
    });

    return result;
  }

  // ── Get cached health score (or compute if missing) ───────────────────────
  async getHealthScore(programId: string): Promise<HealthScoreResult> {
    const cached = await this.prisma.programHealthScore.findUnique({
      where: { programId },
    });

    // Recompute if stale (>5 min) or missing
    const isStale = !cached || (Date.now() - cached.computedAt.getTime() > 5 * 60000);
    if (isStale) {
      return this.computeHealthScore(programId);
    }

    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { name: true },
    });

    return {
      programId,
      programName: program?.name ?? 'Unknown',
      score: cached.score,
      grade: cached.grade,
      trend: cached.trend,
      components: {
        reliability: {
          score: cached.reliabilityScore,
          label: cached.reliabilityScore >= 90 ? 'Excellent' : cached.reliabilityScore >= 70 ? 'Good' : cached.reliabilityScore >= 50 ? 'Fair' : 'Poor',
          detail: `${(cached.successRate24h * 100).toFixed(1)}% success rate (24h)`,
        },
        performance: {
          score: cached.performanceScore,
          label: cached.performanceScore >= 90 ? 'Excellent' : cached.performanceScore >= 70 ? 'Good' : cached.performanceScore >= 50 ? 'Fair' : 'Poor',
          detail: `${cached.avgComputeUnits24h > 0 ? Math.round(cached.avgComputeUnits24h).toLocaleString() : 'N/A'} avg CU`,
        },
        activity: {
          score: cached.activityScore,
          label: cached.activityScore >= 70 ? 'Active' : cached.activityScore >= 40 ? 'Moderate' : cached.activityScore > 0 ? 'Low' : 'Inactive',
          detail: `${cached.txCount24h.toLocaleString()} transactions today`,
        },
        errors: {
          score: cached.errorScore,
          label: cached.errorScore >= 90 ? 'Clean' : cached.errorScore >= 70 ? 'Minor' : cached.errorScore >= 50 ? 'Moderate' : 'High',
          detail: `${(cached.errorRate24h * 100).toFixed(1)}% error rate (24h)`,
        },
        users: {
          score: cached.userScore,
          label: cached.userScore >= 70 ? 'Strong' : cached.userScore >= 40 ? 'Moderate' : cached.userScore > 0 ? 'Low' : 'None',
          detail: `${cached.uniqueUsers24h} unique wallets today`,
        },
      },
      metrics: {
        successRate24h: cached.successRate24h,
        successRate7d: cached.successRate7d,
        avgComputeUnits24h: cached.avgComputeUnits24h,
        errorRate24h: cached.errorRate24h,
        txCount24h: cached.txCount24h,
        txCount7d: cached.txCount7d,
        uniqueUsers24h: cached.uniqueUsers24h,
        uniqueUsers7d: cached.uniqueUsers7d,
        topErrorCode: cached.topErrorCode,
        topErrorCount: cached.topErrorCount,
      },
      strengths: cached.strengths,
      warnings: cached.warnings,
      recommendations: cached.recommendations,
      computedAt: cached.computedAt,
    };
  }

  // ── Get health scores for all programs ───────────────────────────────────
  async getAllHealthScores(): Promise<HealthScoreResult[]> {
    const programs = await this.prisma.program.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    return Promise.all(programs.map(p => this.getHealthScore(p.id)));
  }

  // ── Cron: recompute all health scores every 5 minutes ────────────────────
  @Cron('0 */5 * * * *')
  async recomputeAllHealthScores() {
    try {
      const programs = await this.prisma.program.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      this.logger.log(`Recomputing health scores for ${programs.length} programs`);

      for (const program of programs) {
        await this.computeHealthScore(program.id).catch(err =>
          this.logger.warn(`Failed to compute health score for ${program.name}: ${err.message}`)
        );
      }

      this.logger.log('Health score recomputation complete');
    } catch (err) {
      this.logger.error('Error recomputing health scores:', err);
    }
  }
}
