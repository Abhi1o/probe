#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommands } from './commands/auth';
import { programCommands } from './commands/programs';
import { transactionCommands } from './commands/transactions';
import { alertCommands } from './commands/alerts';
import { analyticsCommands } from './commands/analytics';
import { deployCommands } from './commands/deploy';

const program = new Command();

program
  .name('probe')
  .description('Probe CLI - Solana Program Observability Platform')
  .version('1.0.0');

// Auth commands
program
  .command('login')
  .description('Login to Probe')
  .action(authCommands.login);

program
  .command('logout')
  .description('Logout from Probe')
  .action(authCommands.logout);

program
  .command('whoami')
  .description('Show current user')
  .action(authCommands.whoami);

// Program commands
program
  .command('programs')
  .description('List all programs')
  .action(programCommands.list);

program
  .command('program:add')
  .description('Add a new program')
  .option('-n, --name <name>', 'Program name')
  .option('-i, --id <programId>', 'Program ID')
  .option('-t, --network <network>', 'Network (mainnet-beta, devnet, testnet)')
  .option('-d, --description <description>', 'Program description')
  .action(programCommands.add);

program
  .command('program:get <id>')
  .description('Get program details')
  .action(programCommands.get);

program
  .command('program:stats <id>')
  .description('Get program statistics')
  .action(programCommands.stats);

program
  .command('program:verify <id>')
  .description('Verify program ownership')
  .option('-w, --wallet <address>', 'Wallet address')
  .action(programCommands.verify);

// Transaction commands
program
  .command('transactions <programId>')
  .description('List transactions for a program')
  .option('-l, --limit <number>', 'Limit results', '50')
  .option('-s, --status <status>', 'Filter by status')
  .action(transactionCommands.list);

program
  .command('transaction:get <signature>')
  .description('Get transaction details')
  .action(transactionCommands.get);

// Alert commands
program
  .command('alerts <programId>')
  .description('List alerts for a program')
  .action(alertCommands.list);

program
  .command('alert:create')
  .description('Create a new alert')
  .option('-p, --program <programId>', 'Program ID')
  .option('-n, --name <name>', 'Alert name')
  .option('-c, --condition <condition>', 'Alert condition')
  .option('-t, --threshold <number>', 'Threshold value')
  .action(alertCommands.create);

program
  .command('alert:delete <id>')
  .description('Delete an alert')
  .action(alertCommands.delete);

// Analytics commands
program
  .command('analytics <programId>')
  .description('Get analytics for a program')
  .option('-s, --start <date>', 'Start date')
  .option('-e, --end <date>', 'End date')
  .action(analyticsCommands.get);

program
  .command('trends <programId>')
  .description('Get trends for a program')
  .action(analyticsCommands.trends);

// Deploy commands
program
  .command('deploy')
  .description('Deploy Probe instrumentation contract')
  .option('-n, --network <network>', 'Network (mainnet-beta, devnet, testnet)', 'devnet')
  .option('-k, --keypair <path>', 'Path to keypair file')
  .action(deployCommands.deploy);

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
