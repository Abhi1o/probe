# Backend Development Guide - NestJS

## 🎯 Overview

This document provides a comprehensive guide for building the Probe backend using NestJS, a progressive Node.js framework for building efficient and scalable server-side applications.

## 📋 Table of Contents

1. [Project Setup](#project-setup)
2. [Core Modules](#core-modules)
3. [Database Integration](#database-integration)
4. [Solana Integration](#solana-integration)
5. [Real-Time Features](#real-time-features)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Documentation](#api-documentation)
8. [Testing Strategy](#testing-strategy)

## 🚀 Project Setup

### Prerequisites

```bash
# Required versions
Node.js >= 18.x
npm >= 9.x
PostgreSQL >= 15.x
Redis >= 7.x
```

### Initialize NestJS Project

```bash
# Install NestJS CLI
npm install -g @nestjs/cli

# Create new project
nest new probe-backend

# Navigate to project
cd probe-backend

# Install core dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @prisma/client
npm install @solana/web3.js @coral-xyz/anchor
npm install class-validator class-transformer
npm install bcrypt
npm install bull @nestjs/bull

# Install dev dependencies
npm install -D @types/bcrypt
npm install -D @types/node
npm install -D prisma
npm install -D @nestjs/testing
```

### Project Structure

```bash
# Generate modules
nest g module auth
nest g module users
nest g module programs
nest g module transactions
nest g module monitor
nest g module indexer
nest g module analytics
nest g module alerts
nest g module notifications
nest g module solana

# Generate services
nest g service auth
nest g service users
nest g service programs
nest g service transactions
nest g service monitor
nest g service indexer
nest g service analytics
nest g service alerts
nest g service notifications
nest g service solana

# Generate controllers
nest g controller auth
nest g controller users
nest g controller programs
nest g controller transactions
nest g controller analytics
nest g controller alerts

# Generate gateway for WebSocket
nest g gateway monitor
```

### Environment Configuration

Create `.env` file:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/probe?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Solana
SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC=https://api.devnet.solana.com
SOLANA_TESTNET_RPC=https://api.testnet.solana.com

# CORS
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

## 🏗️ Core Modules

### 1. Main Application Module

**`src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';

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
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Bull Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),

    // Database
    PrismaModule,

    // Feature Modules
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
```

### 2. Prisma Database Module

**`src/database/prisma.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**`src/database/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 3. Authentication Module

**`src/modules/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**`src/modules/auth/auth.service.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

**`src/modules/auth/auth.controller.ts`**

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
```

**DTOs:**

**`src/modules/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**`src/modules/auth/dto/register.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
```

**JWT Strategy:**

**`src/modules/auth/strategies/jwt.strategy.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
  }
}
```

**Guards:**

**`src/modules/auth/guards/jwt-auth.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 4. Users Module

**`src/modules/users/users.service.ts`**

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
```

### 5. Programs Module

**`src/modules/programs/programs.service.ts`**

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProgramDto: CreateProgramDto) {
    return this.prisma.program.create({
      data: {
        ...createProgramDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.program.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            transactions: true,
            alerts: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        alerts: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (program.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return program;
  }

  async update(id: string, userId: string, updateProgramDto: UpdateProgramDto) {
    const program = await this.findOne(id, userId);

    return this.prisma.program.update({
      where: { id },
      data: updateProgramDto,
    });
  }

  async remove(id: string, userId: string) {
    const program = await this.findOne(id, userId);

    await this.prisma.program.delete({
      where: { id },
    });

    return { message: 'Program deleted successfully' };
  }
}
```

**`src/modules/programs/programs.controller.ts`**

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Request() req, @Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(req.user.userId, createProgramDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.programsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.programsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, req.user.userId, updateProgramDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.programsService.remove(id, req.user.userId);
  }
}
```

**DTOs:**

**`src/modules/programs/dto/create-program.dto.ts`**

```typescript
import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';

export enum SolanaNetwork {
  MAINNET = 'mainnet-beta',
  DEVNET = 'devnet',
  TESTNET = 'testnet',
}

export class CreateProgramDto {
  @IsString()
  name: string;

  @IsString()
  programId: string;

  @IsEnum(SolanaNetwork)
  network: SolanaNetwork;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  repositoryUrl?: string;
}
```

### 6. Solana Integration Module

**`src/modules/solana/solana.service.ts`**

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private connections: Map<string, Connection> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeConnections();
  }

  private initializeConnections() {
    const networks = {
      'mainnet-beta': this.configService.get('SOLANA_MAINNET_RPC'),
      'devnet': this.configService.get('SOLANA_DEVNET_RPC'),
      'testnet': this.configService.get('SOLANA_TESTNET_RPC'),
    };

    for (const [network, rpcUrl] of Object.entries(networks)) {
      this.connections.set(network, new Connection(rpcUrl, 'confirmed'));
      this.logger.log(`Connected to Solana ${network}`);
    }
  }

  getConnection(network: string): Connection {
    const connection = this.connections.get(network);
    if (!connection) {
      throw new Error(`No connection found for network: ${network}`);
    }
    return connection;
  }

  async getTransaction(
    signature: string,
    network: string,
  ): Promise<ParsedTransactionWithMeta | null> {
    const connection = this.getConnection(network);
    return connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  }

  async getAccountInfo(address: string, network: string) {
    const connection = this.getConnection(network);
    const publicKey = new PublicKey(address);
    return connection.getAccountInfo(publicKey);
  }

  async subscribeToProgram(
    programId: string,
    network: string,
    callback: (accountInfo: any) => void,
  ): Promise<number> {
    const connection = this.getConnection(network);
    const publicKey = new PublicKey(programId);

    return connection.onProgramAccountChange(
      publicKey,
      (accountInfo) => {
        callback(accountInfo);
      },
      'confirmed',
    );
  }

  async unsubscribe(subscriptionId: number, network: string) {
    const connection = this.getConnection(network);
    await connection.removeProgramAccountChangeListener(subscriptionId);
  }

  async getRecentTransactions(
    programId: string,
    network: string,
    limit: number = 10,
  ) {
    const connection = this.getConnection(network);
    const publicKey = new PublicKey(programId);

    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    });

    const transactions = await Promise.all(
      signatures.map((sig) =>
        connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        }),
      ),
    );

    return transactions.filter((tx) => tx !== null);
  }
}
```

### 7. Monitor Module (WebSocket)

**`src/modules/monitor/monitor.gateway.ts`**

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
})
export class MonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitorGateway.name);

  constructor(private monitorService: MonitorService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.monitorService.unsubscribeAll(client.id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe:program')
  async handleSubscribeProgram(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { programId: string; network: string },
  ) {
    this.logger.log(`Client ${client.id} subscribing to program ${data.programId}`);

    await this.monitorService.subscribeToProgram(
      client.id,
      data.programId,
      data.network,
      (transaction) => {
        client.emit('transaction:new', transaction);
      },
    );

    return { success: true, message: 'Subscribed to program' };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('unsubscribe:program')
  async handleUnsubscribeProgram(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { programId: string },
  ) {
    this.logger.log(`Client ${client.id} unsubscribing from program ${data.programId}`);

    await this.monitorService.unsubscribeFromProgram(client.id, data.programId);

    return { success: true, message: 'Unsubscribed from program' };
  }

  // Emit transaction to all subscribed clients
  emitTransaction(programId: string, transaction: any) {
    this.server.to(`program:${programId}`).emit('transaction:new', transaction);
  }

  // Emit alert to all subscribed clients
  emitAlert(programId: string, alert: any) {
    this.server.to(`program:${programId}`).emit('alert:triggered', alert);
  }
}
```

**`src/modules/monitor/monitor.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SolanaService } from '../solana/solana.service';

interface Subscription {
  clientId: string;
  programId: string;
  network: string;
  subscriptionId: number;
  callback: (data: any) => void;
}

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);
  private subscriptions: Map<string, Subscription[]> = new Map();

  constructor(private solanaService: SolanaService) {}

  async subscribeToProgram(
    clientId: string,
    programId: string,
    network: string,
    callback: (data: any) => void,
  ) {
    const subscriptionId = await this.solanaService.subscribeToProgram(
      programId,
      network,
      callback,
    );

    const subscription: Subscription = {
      clientId,
      programId,
      network,
      subscriptionId,
      callback,
    };

    if (!this.subscriptions.has(clientId)) {
      this.subscriptions.set(clientId, []);
    }

    this.subscriptions.get(clientId).push(subscription);

    this.logger.log(
      `Client ${clientId} subscribed to program ${programId} on ${network}`,
    );
  }

  async unsubscribeFromProgram(clientId: string, programId: string) {
    const clientSubscriptions = this.subscriptions.get(clientId) || [];
    const subscription = clientSubscriptions.find(
      (sub) => sub.programId === programId,
    );

    if (subscription) {
      await this.solanaService.unsubscribe(
        subscription.subscriptionId,
        subscription.network,
      );

      const updatedSubscriptions = clientSubscriptions.filter(
        (sub) => sub.programId !== programId,
      );

      this.subscriptions.set(clientId, updatedSubscriptions);

      this.logger.log(
        `Client ${clientId} unsubscribed from program ${programId}`,
      );
    }
  }

  async unsubscribeAll(clientId: string) {
    const clientSubscriptions = this.subscriptions.get(clientId) || [];

    for (const subscription of clientSubscriptions) {
      await this.solanaService.unsubscribe(
        subscription.subscriptionId,
        subscription.network,
      );
    }

    this.subscriptions.delete(clientId);

    this.logger.log(`All subscriptions removed for client ${clientId}`);
  }
}
```

## 📊 Continue to Next Sections

This is Part 1 of the Backend Guide. Continue to:
- [Part 2: Indexer & Analytics](./02-BACKEND-NESTJS-PART2.md)
- [Part 3: Alerts & Notifications](./02-BACKEND-NESTJS-PART3.md)
- [Part 4: Testing & Deployment](./02-BACKEND-NESTJS-PART4.md)

---

**Next**: [03-FRONTEND-NEXTJS.md](./03-FRONTEND-NEXTJS.md)
