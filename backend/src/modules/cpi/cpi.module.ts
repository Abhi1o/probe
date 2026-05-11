import { Module } from '@nestjs/common';
import { CpiService } from './cpi.service';
import { CpiController } from './cpi.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CpiController],
  providers: [CpiService],
  exports: [CpiService],
})
export class CpiModule {}
