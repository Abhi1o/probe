import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CpiService } from './cpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cpi')
@Controller('programs/:programId/cpi')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CpiController {
  constructor(private readonly cpiService: CpiService) {}

  @Get('graph')
  @ApiOperation({ summary: 'Get CPI dependency graph for a program' })
  getCpiGraph(@Param('programId') programId: string) {
    return this.cpiService.getCpiGraph(programId);
  }

  @Get('callees')
  @ApiOperation({ summary: 'Get programs this program calls (outgoing CPIs)' })
  getTopCallees(@Param('programId') programId: string) {
    return this.cpiService.getTopCallees(programId);
  }

  @Get('callers')
  @ApiOperation({ summary: 'Get programs that call this program (incoming CPIs)' })
  getTopCallers(@Param('programId') programId: string) {
    return this.cpiService.getTopCallers(programId);
  }

  @Post('extract')
  @ApiOperation({ summary: 'Extract CPI edges from stored transactions' })
  extractCpi(@Param('programId') programId: string) {
    return this.cpiService.extractCpiFromStoredTransactions(programId);
  }
}
