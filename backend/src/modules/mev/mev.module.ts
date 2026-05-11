import { Module } from '@nestjs/common';
import { MevService } from './mev.service';
import { MevController } from './mev.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MevController],
  providers: [MevService],
  exports: [MevService],
})
export class MevModule {}
