# 📦 Probe Smart Contracts (Optional)

## 🎯 Overview

This directory is reserved for **optional** Solana smart contracts (Anchor programs) that demonstrate how to integrate Probe monitoring into your own programs.

**Important**: Smart contracts are **NOT required** for the Probe platform to function. The platform monitors **existing** Solana programs without requiring any modifications to them.

## 📋 What's Here?

Currently, this directory contains:
- **Documentation**: Complete guide in `docs/04-SMART-CONTRACTS.md`
- **SDK Examples**: Code examples for integrating Probe monitoring
- **No Implementation**: Actual contracts are optional and not built by default

## 🤔 Do I Need Smart Contracts?

### ❌ You DON'T need smart contracts if:
- You want to monitor **existing** Solana programs
- You're using Probe as an observability platform
- You want to track transactions, analytics, and alerts
- You're deploying the Probe platform

### ✅ You DO need smart contracts if:
- You're building a **new** Solana program
- You want **custom instrumentation** in your program
- You want to emit **custom events** for Probe to capture
- You want **on-chain metrics** specific to your program

## 🚀 Quick Start (Optional)

If you want to create an example monitored program:

### 1. Install Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 2. Create Example Program

```bash
# Navigate to contracts directory
cd contracts

# Initialize Anchor project
anchor init probe-example-program

# Navigate to project
cd probe-example-program
```

### 3. Follow Documentation

See complete implementation guide:
- **[docs/04-SMART-CONTRACTS.md](../docs/04-SMART-CONTRACTS.md)** - Complete guide
- **[docs/08-SDK-DOCUMENTATION.md](../docs/08-SDK-DOCUMENTATION.md)** - SDK reference

## 📚 What's Documented?

The documentation includes:

### 1. Probe SDK for Programs
- Custom event logging
- Function instrumentation
- Metric tracking
- State change monitoring
- Error logging

### 2. Example Counter Program
- Complete Anchor program with Probe integration
- Initialize, increment, decrement, reset operations
- Event emission
- Error handling

### 3. Testing
- Unit tests with Anchor
- Event capture testing
- Integration testing

### 4. Deployment
- Deploy to devnet/mainnet
- Register with Probe platform
- Verify monitoring

## 🎯 How Probe Works Without Smart Contracts

The Probe platform monitors Solana programs by:

1. **Indexing Transactions**
   - Fetches signatures for registered programs
   - Parses transaction data
   - Extracts logs and metadata

2. **Real-time Monitoring**
   - WebSocket subscriptions to program accounts
   - Live transaction streaming
   - Instant updates

3. **Analytics**
   - Transaction success/failure rates
   - Compute units tracking
   - Fee analysis
   - Trend analysis

4. **Alerts**
   - Condition-based triggers
   - Multi-channel notifications
   - Alert history

**No smart contract modifications required!**

## 🔧 Integration Options

### Option 1: Monitor Existing Programs (Recommended)
```typescript
// Just register the program in Probe
await apiClient.post('/programs', {
  name: 'My Program',
  programId: 'YourProgramID...',
  network: 'mainnet-beta',
  description: 'My existing Solana program',
});

// Probe automatically monitors it!
```

### Option 2: Add Custom Instrumentation (Optional)
```rust
// In your Anchor program
use probe_sdk::{ProbeLogger, probe_instrument};

pub fn my_instruction(ctx: Context<MyContext>) -> Result<()> {
    probe_instrument!("my_instruction", {
        // Your instruction logic
        ProbeLogger::log_metric("custom_metric", 42);
        Ok(())
    })
}
```

## 📖 Documentation Reference

| Document | Description |
|----------|-------------|
| [04-SMART-CONTRACTS.md](../docs/04-SMART-CONTRACTS.md) | Complete smart contracts guide |
| [08-SDK-DOCUMENTATION.md](../docs/08-SDK-DOCUMENTATION.md) | SDK reference (Rust, TypeScript, JavaScript) |
| [10-CLI-DOCUMENTATION.md](../docs/10-CLI-DOCUMENTATION.md) | CLI tools for deployment |

## 🎉 Summary

- ✅ **Probe platform is 100% complete** without smart contracts
- ✅ **Monitor any Solana program** without modifications
- ✅ **Smart contracts are optional** for custom instrumentation
- ✅ **Complete documentation** provided for those who want it
- ✅ **Examples and SDK** available for integration

## 🚀 Next Steps

1. **Deploy Probe Platform**: See [READY-TO-DEPLOY.md](../READY-TO-DEPLOY.md)
2. **Register Programs**: Add programs to monitor via the UI
3. **View Analytics**: See real-time data and trends
4. **Configure Alerts**: Set up notifications
5. **(Optional) Build Custom Programs**: Follow docs/04-SMART-CONTRACTS.md

---

**Need Help?**

- 📖 Read [docs/04-SMART-CONTRACTS.md](../docs/04-SMART-CONTRACTS.md)
- 🚀 See [READY-TO-DEPLOY.md](../READY-TO-DEPLOY.md)
- 📚 Check [DOCUMENTATION-INDEX.md](../DOCUMENTATION-INDEX.md)
