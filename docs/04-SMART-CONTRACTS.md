# Smart Contracts Development Guide - Solana/Anchor

## 🎯 Overview

This document covers the development of Solana programs (smart contracts) for the Probe platform, including monitoring SDK integration and on-chain instrumentation.

## 📋 Table of Contents

1. [Anchor Framework Setup](#anchor-framework-setup)
2. [Probe SDK for Programs](#probe-sdk-for-programs)
3. [Example Monitored Program](#example-monitored-program)
4. [Event Emission](#event-emission)
5. [Testing](#testing)
6. [Deployment](#deployment)

## 🚀 Anchor Framework Setup

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify installations
solana --version
anchor --version
```

### Initialize Anchor Project

```bash
# Create new Anchor project
anchor init probe-example-program

# Navigate to project
cd probe-example-program

# Project structure
# probe-example-program/
# ├── Anchor.toml
# ├── Cargo.toml
# ├── programs/
# │   └── probe-example-program/
# │       ├── Cargo.toml
# │       └── src/
# │           └── lib.rs
# ├── tests/
# │   └── probe-example-program.ts
# └── migrations/
#     └── deploy.ts
```

## 📦 Probe SDK for Programs

### SDK Structure

Create a Probe SDK that programs can integrate:

**`programs/probe-sdk/src/lib.rs`**

```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProbeEvent {
    pub event_type: String,
    pub timestamp: i64,
    pub data: Vec<u8>,
}

pub struct ProbeLogger;

impl ProbeLogger {
    /// Log a custom event for Probe monitoring
    pub fn log_event(event_type: &str, data: &[u8]) {
        let timestamp = Clock::get().unwrap().unix_timestamp;
        
        let event = ProbeEvent {
            event_type: event_type.to_string(),
            timestamp,
            data: data.to_vec(),
        };

        // Emit event as program log
        let serialized = serde_json::to_string(&event).unwrap();
        sol_log(&format!("PROBE_EVENT: {}", serialized));
    }

    /// Log function entry
    pub fn log_function_entry(function_name: &str) {
        Self::log_event("function_entry", function_name.as_bytes());
    }

    /// Log function exit
    pub fn log_function_exit(function_name: &str, success: bool) {
        let data = format!("{}:{}", function_name, success);
        Self::log_event("function_exit", data.as_bytes());
    }

    /// Log error
    pub fn log_error(error_msg: &str) {
        Self::log_event("error", error_msg.as_bytes());
    }

    /// Log custom metric
    pub fn log_metric(metric_name: &str, value: u64) {
        let data = format!("{}:{}", metric_name, value);
        Self::log_event("metric", data.as_bytes());
    }

    /// Log state change
    pub fn log_state_change(account: &str, old_value: &str, new_value: &str) {
        let data = format!("{}:{}:{}", account, old_value, new_value);
        Self::log_event("state_change", data.as_bytes());
    }
}

/// Macro for automatic function instrumentation
#[macro_export]
macro_rules! probe_instrument {
    ($func_name:expr, $body:block) => {{
        ProbeLogger::log_function_entry($func_name);
        let result = $body;
        let success = result.is_ok();
        ProbeLogger::log_function_exit($func_name, success);
        result
    }};
}
```

## 🔨 Example Monitored Program

### Counter Program with Probe Integration

**`programs/probe-example-program/Cargo.toml`**

```toml
[package]
name = "probe-example-program"
version = "0.1.0"
description = "Example program with Probe monitoring"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "probe_example_program"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

**`programs/probe-example-program/src/lib.rs`**

```rust
use anchor_lang::prelude::*;
use probe_sdk::{ProbeLogger, probe_instrument};

declare_id!("YourProgramIDHere111111111111111111111111111");

#[program]
pub mod probe_example_program {
    use super::*;

    /// Initialize a counter account
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        probe_instrument!("initialize", {
            let counter = &mut ctx.accounts.counter;
            counter.count = 0;
            counter.authority = ctx.accounts.authority.key();
            
            ProbeLogger::log_state_change(
                &counter.key().to_string(),
                "uninitialized",
                "initialized"
            );
            
            ProbeLogger::log_metric("counter_initialized", 1);
            
            Ok(())
        })
    }

    /// Increment the counter
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        probe_instrument!("increment", {
            let counter = &mut ctx.accounts.counter;
            let old_count = counter.count;
            
            counter.count = counter.count.checked_add(1)
                .ok_or(ErrorCode::Overflow)?;
            
            ProbeLogger::log_state_change(
                &counter.key().to_string(),
                &old_count.to_string(),
                &counter.count.to_string()
            );
            
            ProbeLogger::log_metric("counter_value", counter.count);
            ProbeLogger::log_metric("increment_calls", 1);
            
            Ok(())
        })
    }

    /// Decrement the counter
    pub fn decrement(ctx: Context<Decrement>) -> Result<()> {
        probe_instrument!("decrement", {
            let counter = &mut ctx.accounts.counter;
            let old_count = counter.count;
            
            counter.count = counter.count.checked_sub(1)
                .ok_or(ErrorCode::Underflow)?;
            
            ProbeLogger::log_state_change(
                &counter.key().to_string(),
                &old_count.to_string(),
                &counter.count.to_string()
            );
            
            ProbeLogger::log_metric("counter_value", counter.count);
            ProbeLogger::log_metric("decrement_calls", 1);
            
            Ok(())
        })
    }

    /// Reset the counter
    pub fn reset(ctx: Context<Reset>) -> Result<()> {
        probe_instrument!("reset", {
            let counter = &mut ctx.accounts.counter;
            let old_count = counter.count;
            
            counter.count = 0;
            
            ProbeLogger::log_state_change(
                &counter.key().to_string(),
                &old_count.to_string(),
                "0"
            );
            
            ProbeLogger::log_metric("counter_resets", 1);
            
            Ok(())
        })
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::LEN
    )]
    pub counter: Account<'info, Counter>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Decrement<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Reset<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub counter: Account<'info, Counter>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}

impl Counter {
    pub const LEN: usize = 8 + 32; // count + authority
}

#[error_code]
pub enum ErrorCode {
    #[msg("Counter overflow")]
    Overflow,
    
    #[msg("Counter underflow")]
    Underflow,
}
```

## 📡 Event Emission

### Custom Events for Monitoring

**`programs/probe-example-program/src/events.rs`**

```rust
use anchor_lang::prelude::*;

#[event]
pub struct CounterInitialized {
    pub counter: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CounterIncremented {
    pub counter: Pubkey,
    pub old_value: u64,
    pub new_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct CounterDecremented {
    pub counter: Pubkey,
    pub old_value: u64,
    pub new_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct CounterReset {
    pub counter: Pubkey,
    pub old_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct ErrorOccurred {
    pub error_code: u32,
    pub error_msg: String,
    pub timestamp: i64,
}
```

### Emit Events in Instructions

```rust
use crate::events::*;

pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    let old_count = counter.count;
    
    counter.count = counter.count.checked_add(1)
        .ok_or(ErrorCode::Overflow)?;
    
    // Emit event
    emit!(CounterIncremented {
        counter: counter.key(),
        old_value: old_count,
        new_value: counter.count,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

## 🧪 Testing

### Test File

**`tests/probe-example-program.ts`**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ProbeExampleProgram } from "../target/types/probe_example_program";
import { expect } from "chai";

describe("probe-example-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ProbeExampleProgram as Program<ProbeExampleProgram>;
  
  let counterKeypair: anchor.web3.Keypair;

  beforeEach(async () => {
    counterKeypair = anchor.web3.Keypair.generate();
  });

  it("Initializes a counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterKeypair])
      .rpc();

    const counter = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counter.count.toNumber()).to.equal(0);
    expect(counter.authority.toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Increments the counter", async () => {
    // Initialize
    await program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterKeypair])
      .rpc();

    // Increment
    await program.methods
      .increment()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const counter = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counter.count.toNumber()).to.equal(1);
  });

  it("Decrements the counter", async () => {
    // Initialize and increment
    await program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterKeypair])
      .rpc();

    await program.methods
      .increment()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    // Decrement
    await program.methods
      .decrement()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const counter = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counter.count.toNumber()).to.equal(0);
  });

  it("Resets the counter", async () => {
    // Initialize and increment multiple times
    await program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterKeypair])
      .rpc();

    for (let i = 0; i < 5; i++) {
      await program.methods
        .increment()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    }

    // Reset
    await program.methods
      .reset()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const counter = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counter.count.toNumber()).to.equal(0);
  });

  it("Captures Probe events", async () => {
    const listener = program.addEventListener("CounterIncremented", (event) => {
      console.log("Event captured:", event);
      expect(event.newValue.toNumber()).to.be.greaterThan(event.oldValue.toNumber());
    });

    await program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterKeypair])
      .rpc();

    await program.methods
      .increment()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    await program.removeEventListener(listener);
  });
});
```

### Run Tests

```bash
# Build the program
anchor build

# Run tests
anchor test

# Run tests with logs
anchor test -- --features "test-bpf"
```

## 🚀 Deployment

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Create a new keypair (if needed)
solana-keygen new --outfile ~/.config/solana/devnet.json

# Airdrop SOL for deployment
solana airdrop 2

# Build the program
anchor build

# Deploy
anchor deploy

# Get program ID
solana address -k target/deploy/probe_example_program-keypair.json
```

### Update Program ID

Update `Anchor.toml`:

```toml
[programs.devnet]
probe_example_program = "YourDeployedProgramID"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/devnet.json"
```

Update `lib.rs`:

```rust
declare_id!("YourDeployedProgramID");
```

### Verify Deployment

```bash
# Get program info
solana program show YourDeployedProgramID

# Test deployed program
anchor test --skip-local-validator
```

## 📚 Integration with Probe Platform

### Register Program in Probe

```typescript
// Frontend code to register the deployed program
const registerProgram = async () => {
  await apiClient.post('/programs', {
    name: 'Counter Program',
    programId: 'YourDeployedProgramID',
    network: 'devnet',
    description: 'Example counter program with Probe monitoring',
  });
};
```

### Monitor Program Events

The Probe backend will automatically:
1. Subscribe to program account changes
2. Parse transaction logs for PROBE_EVENT markers
3. Store events in the database
4. Emit real-time updates via WebSocket
5. Trigger alerts based on configured rules

---

**Next**: [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md)
