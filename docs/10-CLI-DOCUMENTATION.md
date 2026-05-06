# Probe CLI Documentation

## 🎯 Overview

The Probe CLI is a command-line tool for managing Solana program monitoring, viewing analytics, and configuring alerts directly from your terminal.

## 📋 Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Commands](#commands)
4. [Usage Examples](#usage-examples)
5. [Advanced Features](#advanced-features)
6. [Scripting & Automation](#scripting--automation)

---

## 🚀 Installation

### Via npm (Recommended)

```bash
# Install globally
npm install -g @probe/cli

# Verify installation
probe --version
```

### Via yarn

```bash
# Install globally
yarn global add @probe/cli

# Verify installation
probe --version
```

### From Source

```bash
# Clone repository
git clone https://github.com/probe/cli.git
cd cli

# Install dependencies
npm install

# Link globally
npm link

# Verify
probe --version
```

---

## ⚙️ Configuration

### Initial Setup

```bash
# Initialize configuration
probe init

# This will prompt for:
# - API URL (default: https://api.probe.dev)
# - API Key (get from dashboard)
# - Default network (mainnet-beta, devnet, testnet)
```

### Configuration File

The CLI stores configuration in `~/.probe/config.json`:

```json
{
  "apiUrl": "https://api.probe.dev",
  "apiKey": "your-api-key-here",
  "defaultNetwork": "devnet",
  "outputFormat": "table"
}
```

### Manual Configuration

```bash
# Set API URL
probe config set api-url https://api.probe.dev

# Set API key
probe config set api-key your-api-key

# Set default network
probe config set network devnet

# Set output format (table, json, yaml)
probe config set output json

# View current configuration
probe config show

# Reset configuration
probe config reset
```

---

## 📚 Commands

### Authentication

#### Login

```bash
# Interactive login
probe login

# Login with credentials
probe login --email user@example.com --password yourpassword

# Login with API key
probe login --api-key your-api-key
```

#### Logout

```bash
# Logout and clear credentials
probe logout
```

#### Whoami

```bash
# Show current user
probe whoami
```

---

### Program Management

#### List Programs

```bash
# List all programs
probe programs list

# List with specific network
probe programs list --network devnet

# Output as JSON
probe programs list --output json

# Limit results
probe programs list --limit 10
```

#### Get Program Details

```bash
# Get program by ID
probe programs get <program-id>

# Get with transactions
probe programs get <program-id> --include-transactions

# Get with alerts
probe programs get <program-id> --include-alerts
```

#### Register Program

```bash
# Interactive registration
probe programs register

# Register with flags
probe programs register \
  --name "My DeFi Protocol" \
  --program-id 11111111111111111111111111111111 \
  --network devnet \
  --description "A decentralized exchange"

# Register from file
probe programs register --file program.json
```

**program.json:**
```json
{
  "name": "My DeFi Protocol",
  "programId": "11111111111111111111111111111111",
  "network": "devnet",
  "description": "A decentralized exchange",
  "repositoryUrl": "https://github.com/user/repo"
}
```

#### Update Program

```bash
# Update program
probe programs update <program-id> \
  --name "Updated Name" \
  --description "Updated description"

# Update from file
probe programs update <program-id> --file updates.json
```

#### Delete Program

```bash
# Delete program (with confirmation)
probe programs delete <program-id>

# Force delete (skip confirmation)
probe programs delete <program-id> --force
```

---

### Transaction Monitoring

#### List Transactions

```bash
# List recent transactions
probe transactions list --program-id <program-id>

# Filter by status
probe transactions list \
  --program-id <program-id> \
  --status SUCCESS

# Filter by date range
probe transactions list \
  --program-id <program-id> \
  --start-date 2026-04-01 \
  --end-date 2026-04-30

# Limit results
probe transactions list \
  --program-id <program-id> \
  --limit 50
```

#### Get Transaction Details

```bash
# Get transaction by signature
probe transactions get <signature>

# Get with full logs
probe transactions get <signature> --include-logs

# Output as JSON
probe transactions get <signature> --output json
```

#### Watch Transactions (Real-time)

```bash
# Watch transactions in real-time
probe transactions watch --program-id <program-id>

# Watch with filters
probe transactions watch \
  --program-id <program-id> \
  --status FAILED

# Watch multiple programs
probe transactions watch \
  --program-id <program-id-1> \
  --program-id <program-id-2>
```

---

### Analytics

#### Program Analytics

```bash
# Get program analytics
probe analytics program <program-id>

# Specify time period
probe analytics program <program-id> --period 24h

# Available periods: 1h, 24h, 7d, 30d
probe analytics program <program-id> --period 7d

# Output as JSON
probe analytics program <program-id> --output json
```

#### Transaction Trends

```bash
# Get transaction trends
probe analytics trends \
  --program-id <program-id> \
  --metric transaction_count \
  --period 7d

# Available metrics:
# - transaction_count
# - success_rate
# - failure_rate
# - avg_compute_units
# - avg_fee
# - avg_latency

# Multiple metrics
probe analytics trends \
  --program-id <program-id> \
  --metric transaction_count \
  --metric success_rate \
  --period 30d
```

#### Custom Reports

```bash
# Generate custom report
probe analytics report \
  --program-id <program-id> \
  --start-date 2026-04-01 \
  --end-date 2026-04-30 \
  --output report.pdf

# Generate CSV export
probe analytics export \
  --program-id <program-id> \
  --format csv \
  --output transactions.csv
```

---

### Alert Management

#### List Alerts

```bash
# List all alerts
probe alerts list --program-id <program-id>

# List enabled alerts only
probe alerts list --program-id <program-id> --enabled

# Output as JSON
probe alerts list --program-id <program-id> --output json
```

#### Create Alert

```bash
# Interactive alert creation
probe alerts create --program-id <program-id>

# Create with flags
probe alerts create \
  --program-id <program-id> \
  --name "High Failure Rate" \
  --condition TRANSACTION_FAILURE_RATE \
  --threshold 10 \
  --comparison GREATER_THAN \
  --channels EMAIL,SLACK

# Create from file
probe alerts create --file alert.json
```

**alert.json:**
```json
{
  "programId": "program-id",
  "name": "High Failure Rate",
  "description": "Alert when failure rate exceeds 10%",
  "condition": "TRANSACTION_FAILURE_RATE",
  "threshold": 10,
  "comparison": "GREATER_THAN",
  "channels": ["EMAIL", "SLACK"],
  "cooldown": 300
}
```

#### Update Alert

```bash
# Update alert
probe alerts update <alert-id> \
  --threshold 15 \
  --enabled false

# Update from file
probe alerts update <alert-id> --file updates.json
```

#### Delete Alert

```bash
# Delete alert
probe alerts delete <alert-id>

# Force delete
probe alerts delete <alert-id> --force
```

#### Test Alert

```bash
# Test alert configuration
probe alerts test <alert-id>

# Test with custom value
probe alerts test <alert-id> --value 15
```

#### Alert History

```bash
# View alert trigger history
probe alerts history <alert-id>

# Filter by date
probe alerts history <alert-id> \
  --start-date 2026-04-01 \
  --end-date 2026-04-30

# Limit results
probe alerts history <alert-id> --limit 50
```

---

### Dashboard

#### Launch Dashboard

```bash
# Launch interactive dashboard
probe dashboard

# Launch for specific program
probe dashboard --program-id <program-id>

# Launch with auto-refresh
probe dashboard --refresh 5s
```

#### Quick Stats

```bash
# Show quick stats
probe stats --program-id <program-id>

# Show stats for all programs
probe stats --all

# Continuous monitoring
probe stats --program-id <program-id> --watch
```

---

## 💡 Usage Examples

### Example 1: Quick Program Setup

```bash
# 1. Login
probe login --email user@example.com

# 2. Register program
probe programs register \
  --name "My DEX" \
  --program-id 11111111111111111111111111111111 \
  --network devnet

# 3. Create alert
probe alerts create \
  --program-id <program-id> \
  --name "High Failure Rate" \
  --condition TRANSACTION_FAILURE_RATE \
  --threshold 10 \
  --channels EMAIL

# 4. Watch transactions
probe transactions watch --program-id <program-id>
```

### Example 2: Daily Monitoring Routine

```bash
#!/bin/bash
# daily-check.sh

PROGRAM_ID="your-program-id"

echo "=== Daily Probe Check ==="
echo ""

# Show program stats
echo "Program Statistics:"
probe stats --program-id $PROGRAM_ID

echo ""

# Show recent failures
echo "Recent Failures:"
probe transactions list \
  --program-id $PROGRAM_ID \
  --status FAILED \
  --limit 10

echo ""

# Show analytics
echo "24h Analytics:"
probe analytics program $PROGRAM_ID --period 24h
```

### Example 3: Automated Reporting

```bash
#!/bin/bash
# weekly-report.sh

PROGRAM_ID="your-program-id"
DATE=$(date +%Y-%m-%d)
REPORT_FILE="probe-report-$DATE.json"

# Generate report
probe analytics report \
  --program-id $PROGRAM_ID \
  --period 7d \
  --output $REPORT_FILE

# Send to Slack
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"Weekly Probe Report\", \"attachments\": [$(cat $REPORT_FILE)]}"
```

### Example 4: Multi-Program Monitoring

```bash
#!/bin/bash
# monitor-all.sh

# Get all programs
PROGRAMS=$(probe programs list --output json | jq -r '.[].id')

# Monitor each program
for PROGRAM_ID in $PROGRAMS; do
  echo "Monitoring: $PROGRAM_ID"
  
  # Get stats
  probe stats --program-id $PROGRAM_ID
  
  # Check for failures
  FAILURES=$(probe transactions list \
    --program-id $PROGRAM_ID \
    --status FAILED \
    --limit 1 \
    --output json | jq length)
  
  if [ $FAILURES -gt 0 ]; then
    echo "⚠️  Failures detected for $PROGRAM_ID"
  fi
  
  echo "---"
done
```

---

## 🔧 Advanced Features

### Output Formats

```bash
# Table format (default)
probe programs list

# JSON format
probe programs list --output json

# YAML format
probe programs list --output yaml

# CSV format
probe programs list --output csv

# Pretty JSON
probe programs list --output json --pretty
```

### Filtering & Sorting

```bash
# Filter by multiple criteria
probe transactions list \
  --program-id <program-id> \
  --status SUCCESS \
  --min-compute-units 100000 \
  --max-compute-units 500000

# Sort results
probe transactions list \
  --program-id <program-id> \
  --sort-by blockTime \
  --order desc

# Pagination
probe transactions list \
  --program-id <program-id> \
  --limit 50 \
  --offset 100
```

### Batch Operations

```bash
# Register multiple programs from file
probe programs batch-register --file programs.json

# Delete multiple programs
probe programs batch-delete --ids id1,id2,id3

# Create multiple alerts
probe alerts batch-create --file alerts.json
```

**programs.json:**
```json
[
  {
    "name": "Program 1",
    "programId": "address1",
    "network": "devnet"
  },
  {
    "name": "Program 2",
    "programId": "address2",
    "network": "devnet"
  }
]
```

### Piping & Chaining

```bash
# Pipe to jq for processing
probe programs list --output json | jq '.[] | select(.network == "devnet")'

# Chain commands
probe programs list --output json | \
  jq -r '.[].id' | \
  xargs -I {} probe stats --program-id {}

# Export and process
probe transactions list \
  --program-id <program-id> \
  --output json > transactions.json

cat transactions.json | jq '.[] | select(.status == "FAILED")'
```

### Environment Variables

```bash
# Set via environment variables
export PROBE_API_URL=https://api.probe.dev
export PROBE_API_KEY=your-api-key
export PROBE_NETWORK=devnet
export PROBE_OUTPUT=json

# Use in commands
probe programs list
```

### Aliases

```bash
# Create aliases in ~/.bashrc or ~/.zshrc
alias pl='probe programs list'
alias pw='probe transactions watch'
alias ps='probe stats'
alias pa='probe analytics program'

# Usage
pl
pw --program-id <program-id>
ps --program-id <program-id>
```

---

## 🤖 Scripting & Automation

### CI/CD Integration

**GitHub Actions:**

```yaml
name: Probe Monitoring

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Install Probe CLI
        run: npm install -g @probe/cli

      - name: Configure Probe
        run: |
          probe config set api-key ${{ secrets.PROBE_API_KEY }}
          probe config set api-url https://api.probe.dev

      - name: Check Program Health
        run: |
          probe stats --program-id ${{ secrets.PROGRAM_ID }}

      - name: Check for Failures
        run: |
          FAILURES=$(probe transactions list \
            --program-id ${{ secrets.PROGRAM_ID }} \
            --status FAILED \
            --limit 10 \
            --output json | jq length)
          
          if [ $FAILURES -gt 5 ]; then
            echo "::error::Too many failures detected"
            exit 1
          fi
```

### Cron Jobs

```bash
# Add to crontab
crontab -e

# Check every hour
0 * * * * /usr/local/bin/probe stats --program-id <program-id> >> /var/log/probe.log

# Daily report at 9 AM
0 9 * * * /home/user/scripts/daily-probe-report.sh

# Alert check every 15 minutes
*/15 * * * * /usr/local/bin/probe alerts check --program-id <program-id>
```

### Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Continuous monitoring script

PROGRAM_ID="your-program-id"
CHECK_INTERVAL=60  # seconds

while true; do
  clear
  echo "=== Probe Monitor ==="
  echo "Time: $(date)"
  echo ""
  
  # Show stats
  probe stats --program-id $PROGRAM_ID
  
  echo ""
  echo "Recent Transactions:"
  probe transactions list \
    --program-id $PROGRAM_ID \
    --limit 5
  
  echo ""
  echo "Next check in $CHECK_INTERVAL seconds..."
  sleep $CHECK_INTERVAL
done
```

### Alerting Script

```bash
#!/bin/bash
# alert-check.sh - Check and notify on issues

PROGRAM_ID="your-program-id"
SLACK_WEBHOOK="your-slack-webhook"

# Get failure rate
FAILURE_RATE=$(probe analytics program $PROGRAM_ID \
  --period 1h \
  --output json | jq -r '.metrics.failureRate')

# Check threshold
if (( $(echo "$FAILURE_RATE > 10" | bc -l) )); then
  # Send Slack notification
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"⚠️ High failure rate detected\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"fields\": [{
          \"title\": \"Failure Rate\",
          \"value\": \"${FAILURE_RATE}%\",
          \"short\": true
        }, {
          \"title\": \"Program\",
          \"value\": \"$PROGRAM_ID\",
          \"short\": true
        }]
      }]
    }"
fi
```

---

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors

```bash
# Clear and re-login
probe logout
probe login

# Verify API key
probe config show

# Test connection
probe whoami
```

#### Network Issues

```bash
# Check API URL
probe config show

# Test connectivity
curl https://api.probe.dev/health

# Use different network
probe config set network mainnet-beta
```

#### Command Not Found

```bash
# Verify installation
which probe

# Reinstall
npm uninstall -g @probe/cli
npm install -g @probe/cli

# Check PATH
echo $PATH
```

### Debug Mode

```bash
# Enable debug logging
probe --debug programs list

# Verbose output
probe --verbose transactions watch --program-id <program-id>

# Save debug logs
probe --debug programs list > debug.log 2>&1
```

---

## 📖 Command Reference

### Global Flags

```bash
--help, -h          Show help
--version, -v       Show version
--output, -o        Output format (table, json, yaml, csv)
--debug             Enable debug mode
--verbose           Verbose output
--quiet, -q         Quiet mode (errors only)
--no-color          Disable colored output
```

### Command Structure

```bash
probe <command> <subcommand> [options] [flags]

# Examples:
probe programs list
probe transactions get <signature>
probe alerts create --program-id <id>
```

---

## 🎓 Tips & Best Practices

1. **Use Aliases**: Create shortcuts for frequently used commands
2. **Output JSON**: Use `--output json` for scripting and piping
3. **Watch Mode**: Use `watch` commands for real-time monitoring
4. **Batch Operations**: Process multiple items efficiently
5. **Environment Variables**: Set defaults to avoid repetitive flags
6. **Error Handling**: Always check exit codes in scripts
7. **Logging**: Redirect output to files for audit trails
8. **Automation**: Integrate with CI/CD and cron jobs

---

**Next**: [README.md](../README.md) - Back to main documentation
