# Database Schema - Prisma & PostgreSQL

## 🎯 Overview

This document defines the complete database schema for the Probe platform using Prisma ORM with PostgreSQL and TimescaleDB extension for time-series data.

## 📋 Table of Contents

1. [Schema Overview](#schema-overview)
2. [Prisma Setup](#prisma-setup)
3. [Complete Schema](#complete-schema)
4. [Migrations](#migrations)
5. [Seed Data](#seed-data)
6. [Queries & Indexes](#queries--indexes)

## 🏗️ Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐
│   Program   │
└──────┬──────┘
       │ 1:N
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│Transaction  │ │  Alert   │ │ ApiKey   │
└─────────────┘ └────┬─────┘ └──────────┘
                     │ 1:N
                     ▼
              ┌──────────────┐
              │AlertTrigger  │
              └──────────────┘
```

## 🚀 Prisma Setup

### Install Prisma

```bash
npm install prisma --save-dev
npm install @prisma/client

# Initialize Prisma
npx prisma init
```

### Configure Prisma

**`prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 📊 Complete Schema

**`prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(USER)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  programs  Program[]
  apiKeys   ApiKey[]
  
  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}

// ============================================
// PROGRAM MANAGEMENT
// ============================================

model Program {
  id          String   @id @default(uuid())
  name        String
  programId   String   // Solana program address
  network     Network
  description String?
  repositoryUrl String?
  
  // Monitoring settings
  isActive    Boolean  @default(true)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  transactions Transaction[]
  alerts       Alert[]
  apiKeys      ApiKey[]
  metrics      Metric[]
  
  @@unique([userId, programId, network])
  @@index([userId])
  @@index([programId])
  @@index([network])
  @@map("programs")
}

enum Network {
  MAINNET_BETA
  DEVNET
  TESTNET
}

// ============================================
// TRANSACTION TRACKING
// ============================================

model Transaction {
  id          String   @id @default(uuid())
  signature   String   @unique
  slot        BigInt
  blockTime   DateTime?
  
  // Transaction details
  status      TransactionStatus
  fee         BigInt
  computeUnits BigInt?
  
  // Parsed data
  instructions Json?
  logs        String[]
  accounts    String[]
  
  // Error information
  error       String?
  
  // Timestamps
  createdAt   DateTime @default(now())
  
  // Relations
  programId   String
  program     Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  
  @@index([programId])
  @@index([signature])
  @@index([blockTime])
  @@index([status])
  @@map("transactions")
}

enum TransactionStatus {
  SUCCESS
  FAILED
  PENDING
}

// ============================================
// METRICS & ANALYTICS
// ============================================

model Metric {
  id          String   @id @default(uuid())
  
  // Metric details
  name        String
  value       Float
  unit        String?
  tags        Json?
  
  // Timestamp
  timestamp   DateTime @default(now())
  
  // Relations
  programId   String
  program     Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  
  @@index([programId])
  @@index([name])
  @@index([timestamp])
  @@map("metrics")
}

// ============================================
// ALERT SYSTEM
// ============================================

model Alert {
  id          String   @id @default(uuid())
  name        String
  description String?
  
  // Alert configuration
  condition   AlertCondition
  threshold   Float
  comparison  ComparisonOperator
  
  // Notification settings
  enabled     Boolean  @default(true)
  channels    NotificationChannel[]
  
  // Cooldown (in seconds)
  cooldown    Int      @default(300)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  programId   String
  program     Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  
  triggers    AlertTrigger[]
  
  @@index([programId])
  @@index([enabled])
  @@map("alerts")
}

enum AlertCondition {
  TRANSACTION_FAILURE_RATE
  COMPUTE_UNITS_EXCEEDED
  TRANSACTION_COUNT
  CUSTOM_METRIC
  ERROR_RATE
  LATENCY
}

enum ComparisonOperator {
  GREATER_THAN
  LESS_THAN
  EQUAL_TO
  GREATER_THAN_OR_EQUAL
  LESS_THAN_OR_EQUAL
}

enum NotificationChannel {
  EMAIL
  SLACK
  DISCORD
  WEBHOOK
}

model AlertTrigger {
  id          String   @id @default(uuid())
  
  // Trigger details
  value       Float
  message     String?
  
  // Notification status
  notified    Boolean  @default(false)
  notifiedAt  DateTime?
  
  // Timestamp
  triggeredAt DateTime @default(now())
  
  // Relations
  alertId     String
  alert       Alert    @relation(fields: [alertId], references: [id], onDelete: Cascade)
  
  @@index([alertId])
  @@index([triggeredAt])
  @@map("alert_triggers")
}

// ============================================
// API KEY MANAGEMENT
// ============================================

model ApiKey {
  id          String   @id @default(uuid())
  name        String
  key         String   @unique
  
  // Permissions
  permissions Json?
  
  // Status
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  programId   String?
  program     Program? @relation(fields: [programId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([key])
  @@map("api_keys")
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id          String   @id @default(uuid())
  
  // Action details
  action      String
  entity      String
  entityId    String
  
  // User information
  userId      String?
  userEmail   String?
  
  // Request details
  ipAddress   String?
  userAgent   String?
  
  // Changes
  oldValue    Json?
  newValue    Json?
  
  // Timestamp
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([entity])
  @@index([createdAt])
  @@map("audit_logs")
}
```

## 🔄 Migrations

### Create Initial Migration

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migration to production
npx prisma migrate deploy
```

### Migration Files

**`prisma/migrations/20260430000000_init/migration.sql`**

```sql
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('MAINNET_BETA', 'DEVNET', 'TESTNET');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('TRANSACTION_FAILURE_RATE', 'COMPUTE_UNITS_EXCEEDED', 'TRANSACTION_COUNT', 'CUSTOM_METRIC', 'ERROR_RATE', 'LATENCY');

-- CreateEnum
CREATE TYPE "ComparisonOperator" AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUAL_TO', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SLACK', 'DISCORD', 'WEBHOOK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "network" "Network" NOT NULL,
    "description" TEXT,
    "repositoryUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL,
    "fee" BIGINT NOT NULL,
    "computeUnits" BIGINT,
    "instructions" JSONB,
    "logs" TEXT[],
    "accounts" TEXT[],
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programId" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programId" TEXT NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "comparison" "ComparisonOperator" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" "NotificationChannel"[],
    "cooldown" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_triggers" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertId" TEXT NOT NULL,

    CONSTRAINT "alert_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "programs_userId_idx" ON "programs"("userId");

-- CreateIndex
CREATE INDEX "programs_programId_idx" ON "programs"("programId");

-- CreateIndex
CREATE INDEX "programs_network_idx" ON "programs"("network");

-- CreateIndex
CREATE UNIQUE INDEX "programs_userId_programId_network_key" ON "programs"("userId", "programId", "network");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_signature_key" ON "transactions"("signature");

-- CreateIndex
CREATE INDEX "transactions_programId_idx" ON "transactions"("programId");

-- CreateIndex
CREATE INDEX "transactions_signature_idx" ON "transactions"("signature");

-- CreateIndex
CREATE INDEX "transactions_blockTime_idx" ON "transactions"("blockTime");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "metrics_programId_idx" ON "metrics"("programId");

-- CreateIndex
CREATE INDEX "metrics_name_idx" ON "metrics"("name");

-- CreateIndex
CREATE INDEX "metrics_timestamp_idx" ON "metrics"("timestamp");

-- CreateIndex
CREATE INDEX "alerts_programId_idx" ON "alerts"("programId");

-- CreateIndex
CREATE INDEX "alerts_enabled_idx" ON "alerts"("enabled");

-- CreateIndex
CREATE INDEX "alert_triggers_alertId_idx" ON "alert_triggers"("alertId");

-- CreateIndex
CREATE INDEX "alert_triggers_triggeredAt_idx" ON "alert_triggers"("triggeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_triggers" ADD CONSTRAINT "alert_triggers_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Enable TimescaleDB Extension

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert metrics table to hypertable
SELECT create_hypertable('metrics', 'timestamp');

-- Convert transactions table to hypertable
SELECT create_hypertable('transactions', 'createdAt');

-- Create continuous aggregates for metrics
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS bucket,
  programId,
  name,
  AVG(value) as avg_value,
  MAX(value) as max_value,
  MIN(value) as min_value,
  COUNT(*) as count
FROM metrics
GROUP BY bucket, programId, name;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('metrics_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

## 🌱 Seed Data

**`prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@probe.dev' },
    update: {},
    create: {
      email: 'admin@probe.dev',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin);

  // Create test user
  const userPassword = await bcrypt.hash('user123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@probe.dev' },
    update: {},
    create: {
      email: 'user@probe.dev',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
    },
  });

  console.log('Created test user:', user);

  // Create sample program
  const program = await prisma.program.create({
    data: {
      name: 'Sample Counter Program',
      programId: '11111111111111111111111111111111',
      network: 'DEVNET',
      description: 'A sample counter program for testing',
      userId: user.id,
    },
  });

  console.log('Created sample program:', program);

  // Create sample alert
  const alert = await prisma.alert.create({
    data: {
      name: 'High Failure Rate',
      description: 'Alert when transaction failure rate exceeds 10%',
      condition: 'TRANSACTION_FAILURE_RATE',
      threshold: 10,
      comparison: 'GREATER_THAN',
      channels: ['EMAIL'],
      programId: program.id,
    },
  });

  console.log('Created sample alert:', alert);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Add seed script to `package.json`:**

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Run seed:**

```bash
npx prisma db seed
```

## 📊 Common Queries

### Get Program with Statistics

```typescript
const programWithStats = await prisma.program.findUnique({
  where: { id: programId },
  include: {
    _count: {
      select: {
        transactions: true,
        alerts: true,
      },
    },
    transactions: {
      take: 10,
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

### Get Transaction Metrics

```typescript
const metrics = await prisma.$queryRaw`
  SELECT
    DATE_TRUNC('hour', "createdAt") as hour,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    AVG("computeUnits") as avg_compute_units
  FROM transactions
  WHERE "programId" = ${programId}
    AND "createdAt" >= NOW() - INTERVAL '24 hours'
  GROUP BY hour
  ORDER BY hour DESC
`;
```

---

**Next**: [06-API-DOCUMENTATION.md](./06-API-DOCUMENTATION.md)
