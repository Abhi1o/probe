import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MevService } from './mev.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mev')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MevController {
  constructor(private readonly mevService: MevService) {}

  @Get('programs/:programId/mev/summary')
  @ApiOperation({ summary: 'Get MEV summary for a program' })
  getMevSummary(
    @Param('programId') programId: string,
    @Query('days') days?: string,
  ) {
    return this.mevService.getMevSummary(programId, days ? parseInt(days) : 30);
  }

  @Post('programs/:programId/mev/detect')
  @ApiOperation({ summary: 'Run MEV detection on stored transactions' })
  detectMev(@Param('programId') programId: string) {
    return this.mevService.detectMevPatterns(programId);
  }

  @Get('mev/global')
  @ApiOperation({ summary: 'Global MEV stats across all programs' })
  getGlobalStats() {
    return this.mevService.getGlobalMevStats();
  }
}
