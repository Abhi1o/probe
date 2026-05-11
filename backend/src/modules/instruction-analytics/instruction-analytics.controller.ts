import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InstructionAnalyticsService } from './instruction-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('instruction-analytics')
@Controller('programs/:programId/instructions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InstructionAnalyticsController {
  constructor(private readonly service: InstructionAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Command center: all instructions as method rows' })
  @ApiQuery({ name: 'window', required: false, description: 'Window in hours (1, 6, 24, 168, 720)' })
  getCommandCenter(
    @Param('programId') programId: string,
    @Query('window') window?: string,
  ) {
    return this.service.getCommandCenter(programId, window ? parseInt(window) : 24);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Instructions ranked by metric' })
  @ApiQuery({ name: 'metric', required: false, enum: ['calls', 'errors', 'error_rate', 'compute', 'callers'] })
  @ApiQuery({ name: 'window', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getLeaderboard(
    @Param('programId') programId: string,
    @Query('metric') metric?: 'calls' | 'errors' | 'error_rate' | 'compute' | 'callers',
    @Query('window') window?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getLeaderboard(
      programId,
      metric || 'calls',
      window ? parseInt(window) : 24,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('new-errors')
  @ApiOperation({ summary: 'Error codes that appeared for the first time in the window' })
  @ApiQuery({ name: 'since', required: false, description: 'Hours to look back' })
  getNewErrors(
    @Param('programId') programId: string,
    @Query('since') since?: string,
  ) {
    return this.service.getNewErrors(programId, since ? parseInt(since) : 24);
  }

  @Get('log')
  @ApiOperation({ summary: 'Live log: recent instruction calls (searchable)' })
  @ApiQuery({ name: 'instruction', required: false })
  @ApiQuery({ name: 'success', required: false })
  @ApiQuery({ name: 'errorCode', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getLiveLog(
    @Param('programId') programId: string,
    @Query('instruction') instruction?: string,
    @Query('success') success?: string,
    @Query('errorCode') errorCode?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getLiveLog(programId, {
      instructionName: instruction,
      success: success !== undefined ? success === 'true' : undefined,
      errorCode,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  // ── Per-instruction routes (must come AFTER named routes) ─────────────────

  @Get(':name/usage')
  @ApiOperation({ summary: 'Usage analytics for a specific instruction' })
  @ApiQuery({ name: 'window', required: false })
  getInstructionUsage(
    @Param('programId') programId: string,
    @Param('name') name: string,
    @Query('window') window?: string,
  ) {
    return this.service.getInstructionUsage(
      programId,
      name,
      window ? parseInt(window) : 24,
    );
  }

  @Get(':name/errors')
  @ApiOperation({ summary: 'Error breakdown for a specific instruction' })
  @ApiQuery({ name: 'window', required: false })
  getErrorBreakdown(
    @Param('programId') programId: string,
    @Param('name') name: string,
    @Query('window') window?: string,
  ) {
    return this.service.getErrorBreakdown(
      programId,
      name,
      window ? parseInt(window) : 24,
    );
  }
}
