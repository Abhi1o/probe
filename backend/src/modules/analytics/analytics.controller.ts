import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Public endpoint - no auth required
  @Get('top-programs')
  @ApiOperation({ summary: 'Get top programs by activity' })
  getTopPrograms(@Query('limit') limit?: string) {
    return this.analyticsService.getTopPrograms(limit ? parseInt(limit) : undefined);
  }

  // All other endpoints require authentication
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('program/:programId/metrics')
  @ApiOperation({ summary: 'Get program metrics (hourly buckets)' })
  getProgramMetrics(
    @Param('programId') programId: string,
    @Query('period') period?: '1h' | '24h' | '7d' | '30d',
  ) {
    return this.analyticsService.getProgramMetrics(programId, period);
  }

  @Get('program/:programId/trends')
  @ApiOperation({ summary: 'Get program trends (daily)' })
  getTrends(
    @Param('programId') programId: string,
    @Query('metric') metric: string,
    @Query('period') period?: '7d' | '30d',
  ) {
    return this.analyticsService.getTrends(programId, metric, period);
  }

  @Get('program/:programId/hourly')
  @ApiOperation({ summary: 'Get hourly activity for today' })
  getHourlyActivity(@Param('programId') programId: string) {
    return this.analyticsService.getHourlyActivity(programId);
  }

  @Get('program/:programId/distribution')
  @ApiOperation({ summary: 'Get success/failure distribution' })
  getDistribution(
    @Param('programId') programId: string,
    @Query('period') period?: '24h' | '7d' | '30d',
  ) {
    return this.analyticsService.getTransactionDistribution(programId, period);
  }

  @Get('program/:programId/performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  getPerformance(@Param('programId') programId: string) {
    return this.analyticsService.getPerformanceMetrics(programId);
  }

  @Get('program/:programId/top-signers')
  @ApiOperation({ summary: 'Get top signers (unique callers)' })
  getTopSigners(
    @Param('programId') programId: string,
    @Query('period') period?: '24h' | '7d' | '30d',
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopSigners(programId, period, limit ? parseInt(limit) : 10);
  }

  @Get('program/:programId/fee-analysis')
  @ApiOperation({ summary: 'Get fee analysis and distribution' })
  getFeeAnalysis(
    @Param('programId') programId: string,
    @Query('period') period?: '24h' | '7d' | '30d',
  ) {
    return this.analyticsService.getFeeAnalysis(programId, period);
  }

  @Get('program/:programId/compute-efficiency')
  @ApiOperation({ summary: 'Get compute unit efficiency analysis' })
  getComputeEfficiency(
    @Param('programId') programId: string,
    @Query('period') period?: '24h' | '7d' | '30d',
  ) {
    return this.analyticsService.getComputeEfficiency(programId, period);
  }

  @Get('program/:programId/error-breakdown')
  @ApiOperation({ summary: 'Get error type breakdown' })
  getErrorBreakdown(
    @Param('programId') programId: string,
    @Query('period') period?: '24h' | '7d' | '30d',
  ) {
    return this.analyticsService.getErrorBreakdown(programId, period);
  }

  @Get('program/:programId/unique-users')
  @ApiOperation({ summary: 'Get unique users over time' })
  getUniqueUsers(
    @Param('programId') programId: string,
    @Query('period') period?: '7d' | '30d',
  ) {
    return this.analyticsService.getUniqueUsersOverTime(programId, period);
  }

  @Get('program/:programId/summary')
  @ApiOperation({ summary: 'Get comprehensive summary stats' })
  getSummary(@Param('programId') programId: string) {
    return this.analyticsService.getSummaryStats(programId);
  }

  // ⚠️ Keep this LAST — generic route must not shadow specific sub-routes
  @Get('program/:programId')
  @ApiOperation({ summary: 'Get program analytics (alias for /metrics)' })
  getProgramMetricsAlias(
    @Param('programId') programId: string,
    @Query('period') period?: '1h' | '24h' | '7d' | '30d',
  ) {
    return this.analyticsService.getProgramMetrics(programId, period);
  }
}
