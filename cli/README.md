# Probe CLI

Command-line interface for the Probe Solana Program Observability Platform.

## Installation

### Global Installation

```bash
npm install -g @probe/cli
# or
yarn global add @probe/cli
```

### Local Installation

```bash
npm install @probe/cli
# or
yarn add @probe/cli
```

## Quick Start

### Login

```bash
probe login
```

### Add a Program

```bash
probe program:add \
  --name "My Program" \
  --id DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 \
  --network devnet \
  --description "My awesome Solana program"
```

### View Programs

```bash
probe programs
```

### View Program Statistics

```bash
probe program:stats <program-id>
```

## Commands

### Authentication

#### `probe login`
Login to Probe platform.

```bash
probe login
```

Interactive prompts for email and password.

#### `probe logout`
Logout from Probe platform.

```bash
probe logout
```

#### `probe whoami`
Show current logged-in user.

```bash
probe whoami
```

### Programs

#### `probe programs`
List all programs.

```bash
probe programs
```

#### `probe program:add`
Add a new program to monitor.

```bash
probe program:add \
  --name "My Program" \
  --id DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 \
  --network mainnet-beta \
  --description "Production DeFi protocol"
```

Options:
- `-n, --name <name>` - Program name (required)
- `-i, --id <programId>` - Solana program ID (required)
- `-t, --network <network>` - Network: mainnet-beta, devnet, or testnet (required)
- `-d, --description <description>` - Program description (optional)

#### `probe program:get <id>`
Get detailed information about a program.

```bash
probe program:get abc123
```

#### `probe program:stats <id>`
Get statistics for a program.

```bash
probe program:stats abc123
```

Shows:
- Total transactions
- Success rate
- Average execution time
- Error count
- Recent activity

#### `probe program:verify <id>`
Verify program ownership.

```bash
probe program:verify abc123 --wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

Options:
- `-w, --wallet <address>` - Wallet address to verify

### Transactions

#### `probe transactions <programId>`
List transactions for a program.

```bash
probe transactions abc123
```

Options:
- `-l, --limit <number>` - Limit results (default: 50)
- `-s, --status <status>` - Filter by status (success, failed, pending)

Examples:
```bash
# Get last 100 transactions
probe transactions abc123 --limit 100

# Get only failed transactions
probe transactions abc123 --status failed
```

#### `probe transaction:get <signature>`
Get detailed information about a transaction.

```bash
probe transaction:get 5j7s6NiJS3JAkvgkoc18WVAsiSaci2pxB2A6ueCJP4tprA2TFg9wSyTLeYouxPBJEMzJinENTkpA52YStRW5Dia7
```

### Alerts

#### `probe alerts <programId>`
List alerts for a program.

```bash
probe alerts abc123
```

#### `probe alert:create`
Create a new alert.

```bash
probe alert:create \
  --program abc123 \
  --name "High Error Rate" \
  --condition error_rate \
  --threshold 5 \
  --comparison greater_than \
  --channels email,slack
```

Options:
- `-p, --program <programId>` - Program ID (required)
- `-n, --name <name>` - Alert name (required)
- `-c, --condition <condition>` - Alert condition (required)
  - `error_rate` - Error rate percentage
  - `transaction_count` - Transaction count
  - `execution_time` - Average execution time
  - `success_rate` - Success rate percentage
- `-t, --threshold <number>` - Threshold value (required)
- `--comparison <comparison>` - Comparison operator (default: greater_than)
  - `greater_than`
  - `less_than`
  - `equal_to`
- `--channels <channels>` - Notification channels (comma-separated)
  - `email`
  - `slack`
  - `discord`
  - `webhook`

#### `probe alert:delete <id>`
Delete an alert.

```bash
probe alert:delete alert-id-123
```

### Analytics

#### `probe analytics <programId>`
Get analytics for a program.

```bash
probe analytics abc123
```

Options:
- `-s, --start <date>` - Start date (YYYY-MM-DD)
- `-e, --end <date>` - End date (YYYY-MM-DD)

Examples:
```bash
# Get analytics for specific date range
probe analytics abc123 --start 2026-04-01 --end 2026-05-01

# Get last 7 days
probe analytics abc123 --start $(date -d '7 days ago' +%Y-%m-%d)
```

#### `probe trends <programId>`
Get trends for a program.

```bash
probe trends abc123
```

Shows:
- Transaction trends (24h, 7d, 30d changes)
- Success rate trends
- Performance trends
- Peak activity times

### Deployment

#### `probe deploy`
Deploy Probe instrumentation contract.

```bash
probe deploy --network devnet
```

Options:
- `-n, --network <network>` - Network (mainnet-beta, devnet, testnet) (default: devnet)
- `-k, --keypair <path>` - Path to keypair file (optional)

The command will:
1. Load keypair from `--keypair` flag, `.env` file, or default Solana CLI location
2. Check wallet balance
3. Verify deployment prerequisites
4. Provide instructions for completing deployment

Examples:
```bash
# Deploy to devnet (default)
probe deploy

# Deploy to mainnet
probe deploy --network mainnet-beta

# Use specific keypair
probe deploy --keypair ~/.config/solana/my-keypair.json
```

## Configuration

### Config File Location

The CLI stores configuration in `~/.probe/config.json`:

```json
{
  "accessToken": "your-access-token",
  "refreshToken": "your-refresh-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "apiUrl": "http://localhost:3000"
}
```

### Environment Variables

```bash
# API URL
export PROBE_API_URL=http://localhost:3000

# Solana wallet for deployment
export SOLANA_WALLET_PRIVATE_KEY=[174,47,154,...]
```

## Examples

### Complete Workflow

```bash
# 1. Login
probe login

# 2. Add a program
probe program:add \
  --name "My DeFi Protocol" \
  --id DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 \
  --network mainnet-beta

# 3. Verify ownership
probe program:verify abc123 --wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# 4. Create alerts
probe alert:create \
  --program abc123 \
  --name "High Error Rate" \
  --condition error_rate \
  --threshold 5 \
  --channels email,slack

probe alert:create \
  --program abc123 \
  --name "Low Success Rate" \
  --condition success_rate \
  --threshold 95 \
  --comparison less_than \
  --channels email

# 5. Monitor transactions
probe transactions abc123 --limit 20

# 6. View analytics
probe analytics abc123 --start 2026-04-01

# 7. Check trends
probe trends abc123
```

### Automation Scripts

#### Daily Report Script

```bash
#!/bin/bash
# daily-report.sh

PROGRAM_ID="abc123"
DATE=$(date +%Y-%m-%d)

echo "=== Daily Report for $DATE ==="
echo ""

echo "Program Statistics:"
probe program:stats $PROGRAM_ID
echo ""

echo "Recent Transactions:"
probe transactions $PROGRAM_ID --limit 10
echo ""

echo "Analytics:"
probe analytics $PROGRAM_ID --start $(date -d '1 day ago' +%Y-%m-%d)
echo ""

echo "Trends:"
probe trends $PROGRAM_ID
```

#### Alert Setup Script

```bash
#!/bin/bash
# setup-alerts.sh

PROGRAM_ID=$1

if [ -z "$PROGRAM_ID" ]; then
  echo "Usage: ./setup-alerts.sh <program-id>"
  exit 1
fi

# High error rate alert
probe alert:create \
  --program $PROGRAM_ID \
  --name "High Error Rate" \
  --condition error_rate \
  --threshold 5 \
  --channels email,slack

# Low success rate alert
probe alert:create \
  --program $PROGRAM_ID \
  --name "Low Success Rate" \
  --condition success_rate \
  --threshold 95 \
  --comparison less_than \
  --channels email,slack

# High transaction volume alert
probe alert:create \
  --program $PROGRAM_ID \
  --name "High Transaction Volume" \
  --condition transaction_count \
  --threshold 1000 \
  --channels slack

# Slow execution time alert
probe alert:create \
  --program $PROGRAM_ID \
  --name "Slow Execution" \
  --condition execution_time \
  --threshold 500 \
  --channels email

echo "Alerts created successfully!"
```

## Troubleshooting

### Not Logged In

If you see "Not logged in" errors:

```bash
probe login
```

### Session Expired

If your session expires:

```bash
probe logout
probe login
```

### API Connection Issues

Check API URL:

```bash
echo $PROBE_API_URL
# or
cat ~/.probe/config.json
```

Set correct API URL:

```bash
export PROBE_API_URL=http://localhost:3000
```

### Deployment Issues

For deployment errors:

1. Check wallet balance:
```bash
solana balance
```

2. Get devnet SOL:
```bash
solana airdrop 2
```

3. Verify keypair:
```bash
solana-keygen verify <public-key> ~/.config/solana/id.json
```

## Support

- Documentation: https://probe.dev/docs
- GitHub: https://github.com/probe/probe
- Discord: https://discord.gg/probe

## License

MIT
