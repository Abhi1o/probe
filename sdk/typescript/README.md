# Probe TypeScript SDK

Official TypeScript SDK for the Probe Solana Program Observability Platform.

## Installation

```bash
npm install @probe/sdk
# or
yarn add @probe/sdk
```

## Quick Start

### Initialize Client

```typescript
import { ProbeClient } from '@probe/sdk';

const client = new ProbeClient({
  apiUrl: 'http://localhost:3000',
  accessToken: 'your-access-token', // Optional, get from login
});
```

### Authentication

```typescript
// Login
const { accessToken, user } = await client.login('user@example.com', 'password');

// Register
const { accessToken, user } = await client.register(
  'user@example.com',
  'password',
  'John Doe'
);
```

### Programs

```typescript
// List all programs
const programs = await client.getPrograms();

// Get specific program
const program = await client.getProgram('program-id');

// Create program
const newProgram = await client.createProgram({
  name: 'My Program',
  programId: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  network: 'devnet',
  description: 'My awesome Solana program',
});

// Get program statistics
const stats = await client.getProgramStats('program-id');
```

### Program Ownership Verification

```typescript
// Generate ownership verification message
const { message } = await client.generateOwnershipMessage(
  'program-id',
  'wallet-address'
);

// Sign the message with your wallet (using @solana/web3.js)
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const keypair = Keypair.fromSecretKey(/* your secret key */);
const messageBytes = new TextEncoder().encode(message);
const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
const signatureBase58 = bs58.encode(signature);

// Verify ownership
const result = await client.verifyOwnership(
  'program-id',
  'wallet-address',
  signatureBase58,
  message
);

console.log('Verified:', result.verified);
console.log('Method:', result.method); // 'upgrade_authority', 'wallet_signature', or 'deployment_history'
```

### Transactions

```typescript
// List transactions for a program
const transactions = await client.getTransactions('program-id', {
  limit: 50,
  offset: 0,
  status: 'success',
});

// Get specific transaction
const transaction = await client.getTransaction('signature');

// Get transaction statistics
const txStats = await client.getTransactionStats('program-id');
```

### Analytics

```typescript
// Get analytics
const metrics = await client.getAnalytics('program-id', {
  startDate: '2026-04-01',
  endDate: '2026-05-01',
  interval: '1h',
});

// Get trends
const trends = await client.getTrends('program-id');

// Get top programs
const topPrograms = await client.getTopPrograms();
```

### Alerts

```typescript
// List alerts
const alerts = await client.getAlerts('program-id');

// Create alert
const alert = await client.createAlert({
  programId: 'program-id',
  name: 'High Error Rate',
  condition: 'error_rate',
  threshold: 5,
  comparison: 'greater_than',
  channels: ['email', 'slack'],
});

// Update alert
const updated = await client.updateAlert('alert-id', {
  threshold: 10,
  enabled: false,
});

// Delete alert
await client.deleteAlert('alert-id');
```

## WebSocket Client

Real-time updates for transactions and metrics:

```typescript
import { ProbeWebSocket } from '@probe/sdk';

const ws = new ProbeWebSocket({
  url: 'http://localhost:3000',
  accessToken: 'your-access-token',
});

// Connect
await ws.connect();

// Subscribe to program transactions
ws.subscribeToProgram('program-id', (transaction) => {
  console.log('New transaction:', transaction);
});

// Subscribe to metrics
ws.subscribeToMetrics('program-id', (metrics) => {
  console.log('New metrics:', metrics);
});

// Subscribe to alerts
ws.subscribeToAlerts('program-id', (alert) => {
  console.log('Alert triggered:', alert);
});

// Unsubscribe
ws.unsubscribeFromProgram('program-id');

// Disconnect
ws.disconnect();
```

## Program Monitor

On-chain monitoring integration:

```typescript
import { ProgramMonitor } from '@probe/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');

const monitor = new ProgramMonitor({
  connection,
  programId,
  probeApiUrl: 'http://localhost:3000',
  probeAccessToken: 'your-access-token',
});

// Start monitoring
await monitor.start();

// Monitor will automatically:
// - Listen for program transactions
// - Send transaction data to Probe API
// - Track performance metrics
// - Detect errors and anomalies

// Stop monitoring
monitor.stop();
```

## TypeScript Types

All SDK methods are fully typed:

```typescript
import type {
  Program,
  Transaction,
  Alert,
  Metric,
  User,
  ProgramStats,
  TransactionStats,
  AnalyticsTrends,
} from '@probe/sdk';
```

## Error Handling

```typescript
try {
  const program = await client.getProgram('invalid-id');
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Program not found');
  } else if (error.response?.status === 401) {
    console.error('Unauthorized - please login');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Configuration

### Environment Variables

```bash
PROBE_API_URL=http://localhost:3000
PROBE_ACCESS_TOKEN=your-access-token
```

### Custom Configuration

```typescript
const client = new ProbeClient({
  apiUrl: process.env.PROBE_API_URL || 'http://localhost:3000',
  accessToken: process.env.PROBE_ACCESS_TOKEN,
  // Optional: API key for server-to-server authentication
  apiKey: process.env.PROBE_API_KEY,
});
```

## Examples

### Complete Monitoring Setup

```typescript
import { ProbeClient, ProbeWebSocket, ProgramMonitor } from '@probe/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

async function setupMonitoring() {
  // 1. Initialize client and login
  const client = new ProbeClient({ apiUrl: 'http://localhost:3000' });
  const { accessToken } = await client.login('user@example.com', 'password');

  // 2. Create or get program
  const program = await client.createProgram({
    name: 'My DeFi Protocol',
    programId: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    network: 'mainnet-beta',
  });

  // 3. Setup alerts
  await client.createAlert({
    programId: program.id,
    name: 'High Error Rate',
    condition: 'error_rate',
    threshold: 5,
    comparison: 'greater_than',
    channels: ['email', 'slack'],
  });

  // 4. Start real-time monitoring
  const ws = new ProbeWebSocket({ url: 'http://localhost:3000', accessToken });
  await ws.connect();
  
  ws.subscribeToProgram(program.id, (tx) => {
    console.log('Transaction:', tx.signature, tx.status);
  });

  ws.subscribeToAlerts(program.id, (alert) => {
    console.log('ALERT:', alert.name, alert.message);
  });

  // 5. Start on-chain monitoring
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const monitor = new ProgramMonitor({
    connection,
    programId: new PublicKey(program.programId),
    probeApiUrl: 'http://localhost:3000',
    probeAccessToken: accessToken,
  });

  await monitor.start();
  console.log('Monitoring started!');
}

setupMonitoring().catch(console.error);
```

## API Reference

See [API Documentation](../../docs/06-API-DOCUMENTATION.md) for complete API reference.

## Support

- Documentation: https://probe.dev/docs
- GitHub: https://github.com/probe/probe
- Discord: https://discord.gg/probe

## License

MIT
