import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { OwnershipVerificationService } from './ownership-verification.service';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [SolanaModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, OwnershipVerificationService],
  exports: [ProgramsService, OwnershipVerificationService],
})
export class ProgramsModule {}
