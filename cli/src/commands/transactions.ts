import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ProbeClient } from '@probe/sdk';
import { getConfig } from '../utils/config';

export const transactionCommands = {
  async list(programId: string, options: any) {
    const spinner = ora('Fetching transactions...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const transactions = await client.getTransactions(programId, {
        limit: parseInt(options.limit) || 50,
        status: options.status,
      });

      spinner.stop();

      if (transactions.length === 0) {
        console.log(chalk.yellow('\nNo transactions found'));
        return;
      }

      const data = [
        ['Signature', 'Status', 'Fee (SOL)', 'Compute Units', 'Time'],
        ...transactions.map((tx) => [
          tx.signature.substring(0, 20) + '...',
          tx.status === 'SUCCESS' ? chalk.green('SUCCESS') : chalk.red('FAILED'),
          (tx.fee / 1e9).toFixed(6),
          tx.computeUnits || 'N/A',
          new Date(tx.blockTime).toLocaleString(),
        ]),
      ];

      console.log('\n' + table(data));
      console.log(chalk.cyan(`Total: ${transactions.length} transactions`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch transactions'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },

  async get(signature: string) {
    const spinner = ora('Fetching transaction...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const tx = await client.getTransaction(signature);
      spinner.stop();

      console.log(chalk.cyan('\n📋 Transaction Details:'));
      console.log(chalk.white(`Signature: ${tx.signature}`));
      console.log(chalk.white(`Status: ${tx.status === 'SUCCESS' ? chalk.green('SUCCESS') : chalk.red('FAILED')}`));
      console.log(chalk.white(`Slot: ${tx.slot}`));
      console.log(chalk.white(`Fee: ${(tx.fee / 1e9).toFixed(6)} SOL`));
      console.log(chalk.white(`Compute Units: ${tx.computeUnits || 'N/A'}`));
      console.log(chalk.white(`Signer: ${tx.signer}`));
      console.log(chalk.white(`Time: ${new Date(tx.blockTime).toLocaleString()}`));

      if (tx.error) {
        console.log(chalk.red(`\nError: ${tx.error}`));
      }

      if (tx.logs && tx.logs.length > 0) {
        console.log(chalk.cyan('\n📝 Logs:'));
        tx.logs.forEach((log, i) => {
          console.log(chalk.gray(`${i + 1}. ${log}`));
        });
      }
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch transaction'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },
};
