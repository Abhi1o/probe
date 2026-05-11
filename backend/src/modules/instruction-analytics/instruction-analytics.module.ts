import { Module } from '@nestjs/common';
import { InstructionAnalyticsService } from './instruction-analytics.service';
import { InstructionAnalyticsController } from './instruction-analytics.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InstructionAnalyticsController],
  providers: [InstructionAnalyticsService],
  exports: [InstructionAnalyticsService],
})
export class InstructionAnalyticsModule {}
