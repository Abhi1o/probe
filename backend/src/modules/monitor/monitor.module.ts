import { Module } from '@nestjs/common';
import { MonitorGateway } from './monitor.gateway';
import { MonitorService } from './monitor.service';

@Module({
  providers: [MonitorGateway, MonitorService],
  exports: [MonitorGateway, MonitorService],
})
export class MonitorModule {}
