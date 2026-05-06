# Probe SDK Documentation

## 🎯 Overview

The Probe SDK provides easy integration for Solana programs to emit monitoring events, track metrics, and enable observability without complex setup.

## 📋 Table of Contents

1. [Installation](#installation)
2. [Rust SDK (On-Chain)](#rust-sdk-on-chain)
3. [TypeScript SDK (Off-Chain)](#typescript-sdk-off-chain)
4. [JavaScript SDK (Browser)](#javascript-sdk-browser)
5. [SDK Examples](#sdk-examples)
6. [Best Practices](#best-practices)

---

## 🚀 Installation

### Rust SDK (For Solana Programs)

**Add to `Cargo.toml`:**

```toml
[dependencies]
probe-sdk = "0.1.0"
anchor-lang = "0.29.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### TypeScript SDK (For Backend/Scripts)

```bash
npm install @probe/sdk
# or
yarn add @probe/sdk
```

### JavaScript SDK (For Frontend)

```bash
npm install @probe/client
# or
yarn add @probe/client
```

---

## 🦀 Rust SDK (On-Chain)

### Basic Setup

**`lib.rs`**

```rust
use anchor_lang::prelude::*;
use probe_sdk::{ProbeLogger, ProbeEvent, probe_instrument};

declare_id!("YourProgramIDHere");

#[program]
pub mod your_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Automatic instrumentation
        probe_instrument!("initialize", {
            let account = &mut ctx.accounts.data;
            account.value = 0;
            
            // Log initialization event
            ProbeLogger::log_event("initialized", b"account_created");
            
            Ok(())
        })
    }

    pub fn update_value(ctx: Context<Update>, new_value: u64) -> Result<()> {
        probe_instrument!("update_value", {
            let account = &mut ctx.accounts.data;
            let old_value = account.value;
            
            // Log state change
            ProbeLogger::log_state_change(
                &account.key().to_string(),
                &old_value.to_string(),
                &new_value.to_string()
            );
            
            account.value = new_value;
            
            // Log custom metric
            ProbeLogger::log_metric("value_updated", new_value);
            
            Ok(())
        })
    }
}
```

### Core Functions

#### 1. Event Logging

```rust
// Log a custom event
ProbeLogger::log_event(event_type: &str, data: &[u8])

// Examples:
ProbeLogger::log_event("user_action", b"deposit");
ProbeLogger::log_event("state_change", b"active");
ProbeLogger::log_event("error", b"insufficient_funds");
```

#### 2. Function Instrumentation

```rust
// Automatic function entry/exit logging
probe_instrument!("function_name", {
    // Your function code here
    Ok(())
})

// This automatically logs:
// - Function entry with timestamp
// - Function exit with success/failure
// - Execution time
```

#### 3. Metric Tracking

```rust
// Log numeric metrics
ProbeLogger::log_metric(metric_name: &str, value: u64)

// Examples:
ProbeLogger::log_metric("tokens_transferred", 1000);
ProbeLogger::log_metric("users_count", 42);
ProbeLogger::log_metric("compute_units_used", 150000);
```

#### 4. State Change Tracking

```rust
// Track account state changes
ProbeLogger::log_state_change(
    account: &str,
    old_value: &str,
    new_value: &str
)

// Example:
ProbeLogger::log_state_change(
    &account.key().to_string(),
    &format!("{}", old_balance),
    &format!("{}", new_balance)
);
```

#### 5. Error Logging

```rust
// Log errors with context
ProbeLogger::log_error(error_msg: &str)

// Example:
if balance < amount {
    ProbeLogger::log_error("Insufficient balance for withdrawal");
    return Err(ErrorCode::InsufficientFunds.into());
}
```

### Advanced Features

#### Custom Events with Structured Data

```rust
use probe_sdk::ProbeEvent;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct TransferEvent {
    from: String,
    to: String,
    amount: u64,
    timestamp: i64,
}

pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    let event = TransferEvent {
        from: ctx.accounts.from.key().to_string(),
        to: ctx.accounts.to.key().to_string(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    };
    
    let event_data = serde_json::to_vec(&event).unwrap();
    ProbeLogger::log_event("transfer", &event_data);
    
    // Transfer logic...
    Ok(())
}
```

#### Performance Monitoring

```rust
use probe_sdk::PerformanceMonitor;

pub fn complex_operation(ctx: Context<ComplexOp>) -> Result<()> {
    let monitor = PerformanceMonitor::start("complex_operation");
    
    // Your complex logic here
    perform_calculation()?;
    
    // Log execution time
    monitor.end();
    
    Ok(())
}
```

#### Conditional Logging

```rust
use probe_sdk::ProbeConfig;

pub fn sensitive_operation(ctx: Context<SensitiveOp>) -> Result<()> {
    // Only log in development
    if ProbeConfig::is_development() {
        ProbeLogger::log_event("sensitive_op", b"executed");
    }
    
    // Your logic...
    Ok(())
}
```

---

## 📘 TypeScript SDK (Off-Chain)

### Installation & Setup

```typescript
import { ProbeClient } from '@probe/sdk';

const probe = new ProbeClient({
  apiUrl: 'https://api.probe.dev',
  apiKey: 'your-api-key',
  network: 'devnet', // or 'mainnet-beta', 'testnet'
});
```

### Core Features

#### 1. Program Registration

```typescript
// Register a program for monitoring
const program = await probe.programs.register({
  name: 'My DeFi Protocol',
  programId: '11111111111111111111111111111111',
  network: 'devnet',
  description: 'A decentralized exchange',
  repositoryUrl: 'https://github.com/user/repo',
});

console.log('Program registered:', program.id);
```

#### 2. Transaction Monitoring

```typescript
// Get recent transactions
const transactions = await probe.transactions.list({
  programId: program.id,
  limit: 50,
  status: 'SUCCESS',
});

// Get specific transaction
const tx = await probe.transactions.get('signature');

// Monitor transactions in real-time
probe.transactions.subscribe(program.id, (transaction) => {
  console.log('New transaction:', transaction);
});
```

#### 3. Analytics

```typescript
// Get program analytics
const analytics = await probe.analytics.getProgram(program.id, {
  period: '24h',
});

console.log('Success rate:', analytics.metrics.successRate);
console.log('Avg compute units:', analytics.metrics.avgComputeUnits);

// Get time-series data
const trends = await probe.analytics.getTrends({
  programId: program.id,
  metric: 'transaction_count',
  period: '7d',
});
```

#### 4. Alert Management

```typescript
// Create an alert
const alert = await probe.alerts.create({
  programId: program.id,
  name: 'High Failure Rate',
  condition: 'TRANSACTION_FAILURE_RATE',
  threshold: 10,
  comparison: 'GREATER_THAN',
  channels: ['EMAIL', 'SLACK'],
});

// List alerts
const alerts = await probe.alerts.list(program.id);

// Update alert
await probe.alerts.update(alert.id, {
  threshold: 15,
  enabled: false,
});

// Delete alert
await probe.alerts.delete(alert.id);
```

#### 5. Real-Time Events

```typescript
// Connect to WebSocket
await probe.connect();

// Subscribe to program events
probe.on('transaction:new', (transaction) => {
  console.log('New transaction:', transaction);
});

probe.on('alert:triggered', (alert) => {
  console.log('Alert triggered:', alert);
});

// Unsubscribe
probe.off('transaction:new');

// Disconnect
await probe.disconnect();
```

### Advanced Usage

#### Batch Operations

```typescript
// Register multiple programs
const programs = await probe.programs.batchRegister([
  {
    name: 'Program 1',
    programId: 'address1',
    network: 'devnet',
  },
  {
    name: 'Program 2',
    programId: 'address2',
    network: 'devnet',
  },
]);

// Get multiple transactions
const txs = await probe.transactions.batchGet([
  'signature1',
  'signature2',
  'signature3',
]);
```

#### Custom Queries

```typescript
// Advanced transaction filtering
const transactions = await probe.transactions.query({
  programId: program.id,
  startDate: new Date('2026-04-01'),
  endDate: new Date('2026-04-30'),
  status: ['SUCCESS', 'FAILED'],
  minComputeUnits: 100000,
  maxComputeUnits: 500000,
  orderBy: 'blockTime',
  order: 'desc',
});

// Custom analytics query
const customMetrics = await probe.analytics.query({
  programId: program.id,
  metrics: ['success_rate', 'avg_fee', 'total_compute_units'],
  groupBy: 'hour',
  period: '7d',
});
```

#### Error Handling

```typescript
try {
  const program = await probe.programs.register({
    name: 'My Program',
    programId: 'invalid-address',
    network: 'devnet',
  });
} catch (error) {
  if (error instanceof ProbeError) {
    console.error('Probe error:', error.message);
    console.error('Error code:', error.code);
    console.error('Details:', error.details);
  }
}
```

---

## 🌐 JavaScript SDK (Browser)

### Installation & Setup

```typescript
import { ProbeClient } from '@probe/client';

const probe = new ProbeClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  wsUrl: process.env.NEXT_PUBLIC_WS_URL,
});
```

### Authentication

```typescript
// Login
const { user, accessToken } = await probe.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Store token
probe.setAccessToken(accessToken);

// Register
const newUser = await probe.auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword',
});

// Logout
await probe.auth.logout();
```

### React Hooks

```typescript
import { useProbe, usePrograms, useTransactions } from '@probe/client/react';

function Dashboard() {
  const probe = useProbe();
  const { programs, isLoading } = usePrograms();
  const { transactions } = useTransactions(programId);

  return (
    <div>
      {programs.map(program => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}
```

### Real-Time Updates

```typescript
import { useRealTime } from '@probe/client/react';

function TransactionFeed({ programId }) {
  const { transactions, isConnected } = useRealTime(programId);

  useEffect(() => {
    if (isConnected) {
      console.log('Connected to real-time feed');
    }
  }, [isConnected]);

  return (
    <div>
      {transactions.map(tx => (
        <TransactionItem key={tx.signature} transaction={tx} />
      ))}
    </div>
  );
}
```

---

## 📚 SDK Examples

### Example 1: DeFi Protocol Monitoring

```rust
use anchor_lang::prelude::*;
use probe_sdk::{ProbeLogger, probe_instrument};

#[program]
pub mod defi_protocol {
    use super::*;

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
    ) -> Result<()> {
        probe_instrument!("swap", {
            let pool = &mut ctx.accounts.pool;
            
            // Log swap initiation
            ProbeLogger::log_event("swap_initiated", 
                format!("amount_in:{}", amount_in).as_bytes()
            );
            
            // Calculate swap
            let amount_out = calculate_swap(pool, amount_in)?;
            
            // Check slippage
            if amount_out < min_amount_out {
                ProbeLogger::log_error("Slippage exceeded");
                return Err(ErrorCode::SlippageExceeded.into());
            }
            
            // Execute swap
            execute_swap(ctx, amount_in, amount_out)?;
            
            // Log metrics
            ProbeLogger::log_metric("swap_volume", amount_in);
            ProbeLogger::log_metric("swap_count", 1);
            
            // Log state change
            ProbeLogger::log_state_change(
                &pool.key().to_string(),
                &format!("reserve:{}", pool.reserve),
                &format!("reserve:{}", pool.reserve + amount_in)
            );
            
            Ok(())
        })
    }
}
```

### Example 2: NFT Marketplace Monitoring

```typescript
import { ProbeClient } from '@probe/sdk';

class NFTMarketplace {
  private probe: ProbeClient;

  constructor() {
    this.probe = new ProbeClient({
      apiUrl: process.env.PROBE_API_URL,
      apiKey: process.env.PROBE_API_KEY,
    });
  }

  async monitorListings() {
    // Subscribe to marketplace events
    this.probe.transactions.subscribe(
      this.marketplaceProgramId,
      async (transaction) => {
        // Parse listing events
        const listing = this.parseListingEvent(transaction);
        
        if (listing) {
          // Track listing metrics
          await this.trackListingMetrics(listing);
          
          // Check for suspicious activity
          if (listing.price > this.suspiciousThreshold) {
            await this.probe.alerts.trigger({
              programId: this.marketplaceProgramId,
              message: `Suspicious listing: ${listing.price} SOL`,
              severity: 'HIGH',
            });
          }
        }
      }
    );
  }

  async getMarketplaceAnalytics() {
    const analytics = await this.probe.analytics.getProgram(
      this.marketplaceProgramId,
      { period: '30d' }
    );

    return {
      totalListings: analytics.metrics.totalTransactions,
      avgPrice: analytics.metrics.avgValue,
      successRate: analytics.metrics.successRate,
      trends: analytics.timeSeries,
    };
  }
}
```

### Example 3: Gaming Platform Monitoring

```typescript
import { ProbeClient } from '@probe/sdk';

class GameMonitor {
  private probe: ProbeClient;

  constructor(programId: string) {
    this.probe = new ProbeClient({
      apiUrl: process.env.PROBE_API_URL,
      apiKey: process.env.PROBE_API_KEY,
    });
    
    this.setupAlerts(programId);
  }

  async setupAlerts(programId: string) {
    // Alert for high failure rate
    await this.probe.alerts.create({
      programId,
      name: 'Game Transaction Failures',
      condition: 'TRANSACTION_FAILURE_RATE',
      threshold: 5,
      comparison: 'GREATER_THAN',
      channels: ['DISCORD', 'EMAIL'],
    });

    // Alert for unusual compute usage
    await this.probe.alerts.create({
      programId,
      name: 'High Compute Usage',
      condition: 'COMPUTE_UNITS_EXCEEDED',
      threshold: 1000000,
      comparison: 'GREATER_THAN',
      channels: ['SLACK'],
    });
  }

  async getPlayerStats(playerAddress: string) {
    const transactions = await this.probe.transactions.query({
      programId: this.gameProgramId,
      accounts: [playerAddress],
      period: '7d',
    });

    return {
      gamesPlayed: transactions.length,
      successRate: this.calculateSuccessRate(transactions),
      avgComputeUnits: this.calculateAvgCompute(transactions),
    };
  }
}
```

---

## 🎯 Best Practices

### 1. Event Naming Conventions

```rust
// ✅ Good: Clear, descriptive names
ProbeLogger::log_event("user_registered", data);
ProbeLogger::log_event("token_transferred", data);
ProbeLogger::log_event("pool_created", data);

// ❌ Bad: Vague or unclear names
ProbeLogger::log_event("event1", data);
ProbeLogger::log_event("thing_happened", data);
```

### 2. Metric Tracking

```rust
// ✅ Good: Track meaningful metrics
ProbeLogger::log_metric("total_volume_usd", volume);
ProbeLogger::log_metric("active_users_count", users);
ProbeLogger::log_metric("average_transaction_size", avg_size);

// ❌ Bad: Track everything
ProbeLogger::log_metric("random_number", 42);
```

### 3. Error Logging

```rust
// ✅ Good: Provide context
ProbeLogger::log_error(&format!(
    "Insufficient balance: required {}, available {}",
    required, available
));

// ❌ Bad: Generic errors
ProbeLogger::log_error("Error occurred");
```

### 4. Performance Considerations

```rust
// ✅ Good: Log important events only
if is_significant_transaction {
    ProbeLogger::log_event("large_transfer", data);
}

// ❌ Bad: Log everything
ProbeLogger::log_event("every_single_thing", data);
```

### 5. State Change Tracking

```rust
// ✅ Good: Track meaningful state changes
ProbeLogger::log_state_change(
    &account.key().to_string(),
    &format!("status:{}", old_status),
    &format!("status:{}", new_status)
);

// ❌ Bad: Track trivial changes
ProbeLogger::log_state_change("account", "1", "2");
```

---

## 📖 API Reference

### Rust SDK

```rust
// Core functions
ProbeLogger::log_event(event_type: &str, data: &[u8])
ProbeLogger::log_metric(name: &str, value: u64)
ProbeLogger::log_error(message: &str)
ProbeLogger::log_state_change(account: &str, old: &str, new: &str)
ProbeLogger::log_function_entry(name: &str)
ProbeLogger::log_function_exit(name: &str, success: bool)

// Macros
probe_instrument!(function_name, { code })
```

### TypeScript SDK

```typescript
// Client initialization
new ProbeClient(config: ProbeConfig)

// Programs
probe.programs.register(data: RegisterProgramDto)
probe.programs.list()
probe.programs.get(id: string)
probe.programs.update(id: string, data: UpdateProgramDto)
probe.programs.delete(id: string)

// Transactions
probe.transactions.list(params: TransactionQueryParams)
probe.transactions.get(signature: string)
probe.transactions.subscribe(programId: string, callback: Function)

// Analytics
probe.analytics.getProgram(programId: string, params: AnalyticsParams)
probe.analytics.getTrends(params: TrendsParams)

// Alerts
probe.alerts.create(data: CreateAlertDto)
probe.alerts.list(programId: string)
probe.alerts.update(id: string, data: UpdateAlertDto)
probe.alerts.delete(id: string)
```

---

**Next**: [10-CLI-DOCUMENTATION.md](./10-CLI-DOCUMENTATION.md)
