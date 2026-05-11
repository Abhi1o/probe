import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wallets')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('programs/:programId/wallet-intelligence/summary')
  @ApiOperation({ summary: 'Get wallet composition summary for a program' })
  getProgramWalletSummary(@Param('programId') programId: string) {
    return this.walletsService.getProgramWalletSummary(programId);
  }

  @Post('programs/:programId/wallet-intelligence/classify')
  @ApiOperation({ summary: 'Classify all wallets for a program' })
  classifyProgramWallets(@Param('programId') programId: string) {
    return this.walletsService.classifyProgramWallets(programId);
  }

  @Get('wallets/:address')
  @ApiOperation({ summary: 'Get wallet intelligence profile' })
  getWalletProfile(@Param('address') address: string) {
    return this.walletsService.getWalletProfile(address);
  }
}
