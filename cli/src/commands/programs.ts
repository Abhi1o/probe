import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ProbeClient } from '@probe/sdk';
import { getConfig } from '../utils/config';

export const programCommands = {
  async list() {
    const spinner = ora('Fetching programs...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const programs = await client.getPrograms();
      spinner.stop();

      if (programs.length === 0) {
        console.log(chalk.yellow('\nNo programs found'));
        console.log(chalk.cyan('Add a program: probe program:add'));
        return;
      }

      const data = [
        ['ID', 'Name', 'Program ID', 'Network', 'Status'],
        ...programs.map((p) => [
          p.id.substring(0, 8),
          p.name,
          p.programId.substring(0, 20) + '...',
          p.network,
          p.isActive ? chalk.green('Active') : chalk.red('Inactive'),
        ]),
      ];

      console.log('\n' + table(data));
      console.log(chalk.cyan(`Total: ${programs.length} programs`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch programs'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },

  async add(options: any) {
    try {
      let answers = options;

      if (!options.name || !options.id) {
        answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Program name:',
            when: !options.name,
          },
          {
            type: 'input',
            name: 'id',
            message: 'Program ID:',
            when: !options.id,
          },
          {
            type: 'list',
            name: 'network',
            message: 'Network:',
            choices: ['MAINNET_BETA', 'DEVNET', 'TESTNET'],
            default: 'DEVNET',
            when: !options.network,
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):',
            when: !options.description,
          },
        ]);
      }

      const spinner = ora('Adding program...').start();

      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const program = await client.createProgram({
        name: answers.name || options.name,
        programId: answers.id || options.id,
        network: (answers.network || options.network || 'DEVNET').toUpperCase(),
        description: answers.description || options.description,
      });

      spinner.succeed(chalk.green('Program added successfully!'));
      console.log(chalk.cyan('\n📋 Program Details:'));
      console.log(chalk.white(`ID: ${program.id}`));
      console.log(chalk.white(`Name: ${program.name}`));
      console.log(chalk.white(`Program ID: ${program.programId}`));
      console.log(chalk.white(`Network: ${program.network}`));
    } catch (error: any) {
      console.error(chalk.red(`\nFailed to add program: ${error.message}`));
    }
  },

  async get(id: string) {
    const spinner = ora('Fetching program...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const program = await client.getProgram(id);
      spinner.stop();

      console.log(chalk.cyan('\n📋 Program Details:'));
      console.log(chalk.white(`ID: ${program.id}`));
      console.log(chalk.white(`Name: ${program.name}`));
      console.log(chalk.white(`Program ID: ${program.programId}`));
      console.log(chalk.white(`Network: ${program.network}`));
      console.log(chalk.white(`Status: ${program.isActive ? chalk.green('Active') : chalk.red('Inactive')}`));
      
      if (program.description) {
        console.log(chalk.white(`Description: ${program.description}`));
      }
      
      if (program.ownerWallet) {
        console.log(chalk.white(`Owner: ${program.ownerWallet}`));
        console.log(chalk.white(`Verified: ${chalk.green('Yes')} (${program.verificationMethod})`));
      }
      
      console.log(chalk.white(`Created: ${new Date(program.createdAt).toLocaleString()}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch program'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },

  async stats(id: string) {
    const spinner = ora('Fetching statistics...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const stats = await client.getProgramStats(id);
      spinner.stop();

      console.log(chalk.cyan('\n📊 Program Statistics:'));
      console.log(chalk.white(`Total Transactions: ${stats.totalTransactions}`));
      console.log(chalk.white(`Successful: ${chalk.green(stats.successfulTransactions)}`));
      console.log(chalk.white(`Failed: ${chalk.red(stats.failedTransactions)}`));
      console.log(chalk.white(`Success Rate: ${stats.successRate}%`));
      console.log(chalk.white(`Last 24 Hours: ${stats.last24Hours}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch statistics'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },

  async verify(id: string, options: any) {
    try {
      let walletAddress = options.wallet;

      if (!walletAddress) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'wallet',
            message: 'Wallet address:',
          },
        ]);
        walletAddress = answers.wallet;
      }

      const spinner = ora('Verifying ownership...').start();

      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const result = await client.verifyOwnership(id, walletAddress);
      
      if (result.isOwner) {
        spinner.succeed(chalk.green('Ownership verified!'));
        console.log(chalk.cyan('\n✅ Verification Details:'));
        console.log(chalk.white(`Method: ${result.method}`));
        console.log(chalk.white(`Wallet: ${walletAddress}`));
        if (result.upgradeAuthority) {
          console.log(chalk.white(`Upgrade Authority: ${result.upgradeAuthority}`));
        }
      } else {
        spinner.fail(chalk.red('Ownership verification failed'));
        console.log(chalk.yellow(`\nReason: ${result.details}`));
      }
    } catch (error: any) {
      console.error(chalk.red(`\nVerification failed: ${error.message}`));
    }
  },
};
