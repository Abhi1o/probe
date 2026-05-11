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
import { InstructionAnalyticsModule } from './modules/instruction-analytics/instruction-analytics.module';
import { HealthModule } from './modules/health/health.module';
import { CpiModule } from './modules/cpi/cpi.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { MevModule } from './modules/mev/mev.module';

function getRedisConfig() {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;

  if (redisUrl) {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  };
}

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
      redis: getRedisConfig(),
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
    InstructionAnalyticsModule,
    HealthModule,
    CpiModule,
    WalletsModule,
    MevModule,
  ],
})
export class AppModule {}
