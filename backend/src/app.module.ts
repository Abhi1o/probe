import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Core Modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SolanaModule } from './modules/solana/solana.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Bull Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),

    // Core Modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProgramsModule,
    TransactionsModule,
    MonitorModule,
    IndexerModule,
    AnalyticsModule,
    AlertsModule,
    NotificationsModule,
    SolanaModule,
  ],
})
export class AppModule {}
