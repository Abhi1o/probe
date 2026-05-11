import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('healthz')
  @ApiOperation({ summary: 'Container readiness health check' })
  async readiness() {
    return this.healthService.getReadiness();
  }

  // Public endpoint — no auth needed for program score lookup
  @Get('programs/:programId/health')
  @ApiOperation({ summary: 'Get program health score' })
  getHealthScore(@Param('programId') programId: string) {
    return this.healthService.getHealthScore(programId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('programs/:programId/health/recompute')
  @ApiOperation({ summary: 'Force recompute health score' })
  recompute(@Param('programId') programId: string) {
    return this.healthService.computeHealthScore(programId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('health/all')
  @ApiOperation({ summary: 'Get health scores for all programs' })
  getAllHealthScores() {
    return this.healthService.getAllHealthScores();
  }
}
