# Probe: Solana Program Observability Platform

<div align="center">

![Probe Logo](https://via.placeholder.com/200x200?text=PROBE)

**Real-time monitoring, debugging, and analytics for Solana programs**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![Solana](https://img.shields.io/badge/Solana-1.17-purple)](https://solana.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 🚀 **NEW: Complete Implementation Guide Available!**

> **📖 [START HERE - Complete Implementation Guide](./START-HERE.md)**  
> Everything you need in one place: research findings, architecture, code examples, and 7-day implementation plan.

---

## 🎯 Overview

**Probe** is a comprehensive observability platform specifically designed for Solana blockchain programs. It provides developers with real-time insights, advanced debugging tools, and performance analytics to monitor and optimize their on-chain applications.

### Why Probe?

- **🔍 Real-Time Monitoring**: Track transactions, account changes, and program execution in real-time
- **🐛 Advanced Debugging**: Replay transactions, inspect account states, and analyze program logs
- **📊 Performance Analytics**: Measure compute units, latency, throughput, and identify bottlenecks
- **🚨 Smart Alerts**: Configure custom alerts with anomaly detection and multi-channel notifications
- **📈 Historical Analysis**: Query and visualize historical data with time-series analytics
- **🔌 Easy Integration**: Simple SDK integration with minimal code changes

## ✨ Features

### Core Capabilities

- **Transaction Monitoring**
  - Real-time transaction tracking
  - Success/failure rate analysis
  - Compute unit usage tracking
  - Fee analysis and optimization

- **Program Analytics**
  - Instruction-level tracing
  - Account state inspection
  - Log aggregation and parsing
  - Performance metrics dashboard

- **Alert System**
  - Custom alert rules
  - Threshold-based notifications
  - Anomaly detection
  - Multi-channel delivery (Email, Slack, Discord)

- **Developer Tools**
  - Transaction replay
  - Program event emission
  - SDK for instrumentation
  - API for programmatic access

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.x
npm >= 9.x
PostgreSQL >= 15.x
Redis >= 7.x
Docker & Docker Compose (optional)
```

### Installation

#### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/probe.git
cd probe

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
```

#### Option 2: Manual Setup

**Backend Setup:**

```bash
cd backend

# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run start:dev
```

**Frontend Setup:**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### First Steps

1. **Register an Account**
   - Navigate to http://localhost:3001/register
   - Create your account

2. **Add Your First Program**
   - Go to Dashboard → Add Program
   - Enter your Solana program ID and network
   - Start monitoring!

3. **Configure Alerts**
   - Navigate to your program
   - Go to Alerts tab
   - Create custom alert rules

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Getting Started
- [📖 Project Overview](./docs/00-PROJECT-OVERVIEW.md) - Complete project introduction
- [🏗️ Architecture](./docs/01-ARCHITECTURE.md) - System architecture and design

### Development Guides
- [⚙️ Backend (NestJS)](./docs/02-BACKEND-NESTJS.md) - Backend development guide
- [🎨 Frontend (Next.js)](./docs/03-FRONTEND-NEXTJS.md) - Frontend development guide
- [⛓️ Smart Contracts](./docs/04-SMART-CONTRACTS.md) - Solana program integration
- [💾 Database Schema](./docs/05-DATABASE-SCHEMA.md) - Database design and migrations

### Operations
- [📡 API Documentation](./docs/06-API-DOCUMENTATION.md) - Complete API reference
- [🚀 Deployment](./docs/07-DEPLOYMENT.md) - Production deployment guide

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │   Mobile     │  │     CLI      │ │
│  │  (Next.js)   │  │  (Future)    │  │    Tool      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│                     API GATEWAY                           │
│                    (NestJS + WebSocket)                   │
└────────────────────────────┬─────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌─────▼──────────┐ ┌────▼──────────┐
│  CORE SERVICES    │ │  DATA LAYER    │ │  BLOCKCHAIN   │
│  - Monitor        │ │  - PostgreSQL  │ │  - Solana RPC │
│  - Indexer        │ │  - TimescaleDB │ │  - WebSocket  │
│  - Analytics      │ │  - Redis       │ │  - Parser     │
│  - Alerts         │ │  - Bull Queue  │ │               │
└───────────────────┘ └────────────────┘ └───────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- Zustand (State Management)
- Recharts (Data Visualization)
- Socket.io Client (Real-time)

**Backend:**
- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL + TimescaleDB
- Redis
- Bull (Queue)
- Socket.io (WebSocket)

**Blockchain:**
- Solana Web3.js
- Anchor Framework
- Rust (Smart Contracts)

## 🛠️ Development

### Project Structure

```
probe/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── common/         # Shared utilities
│   │   └── database/       # Prisma setup
│   ├── prisma/             # Database schema
│   └── test/               # Tests
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   ├── hooks/         # Custom hooks
│   │   └── store/         # State management
│   └── public/            # Static assets
│
├── contracts/             # Solana programs
│   ├── programs/          # Anchor programs
│   ├── tests/             # Program tests
│   └── migrations/        # Deployment scripts
│
├── docs/                  # Documentation
├── docker-compose.yml     # Docker setup
└── README.md             # This file
```

### Running Tests

**Backend Tests:**
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

**Frontend Tests:**
```bash
cd frontend
npm run test              # Jest tests
npm run test:watch        # Watch mode
```

**Smart Contract Tests:**
```bash
cd contracts
anchor test               # Run all tests
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 📊 Roadmap

### Phase 1: MVP (Current)
- [x] Real-time transaction monitoring
- [x] Basic analytics dashboard
- [x] Alert system
- [x] Program management
- [ ] Transaction replay

### Phase 2: Enhanced Features
- [ ] Advanced analytics
- [ ] Custom metrics
- [ ] Team collaboration
- [ ] API rate limiting tiers
- [ ] Mobile app

### Phase 3: Enterprise
- [ ] Multi-tenant support
- [ ] SSO integration
- [ ] Advanced security features
- [ ] Custom integrations
- [ ] Dedicated support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Foundation for the amazing blockchain platform
- Anchor Framework team for the development tools
- Open source community for the incredible libraries

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/probe/issues)
- **Discord**: [Join our community](https://discord.gg/probe)
- **Email**: support@probe.dev

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-org/probe&type=Date)](https://star-history.com/#your-org/probe&Date)

---

<div align="center">

**Built with ❤️ for the Solana ecosystem**

[Website](https://probe.dev) • [Documentation](./docs/) • [Twitter](https://twitter.com/probe_dev) • [Discord](https://discord.gg/probe)

</div>
