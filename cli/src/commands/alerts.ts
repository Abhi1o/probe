import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ProbeClient } from '@probe/sdk';
import { getConfig } from '../utils/config';

export const alertCommands = {
  async list(programId: string) {
    const spinner = ora('Fetching alerts...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const alerts = await client.getAlerts(programId);
      spinner.stop();

      if (alerts.length === 0) {
        console.log(chalk.yellow('\nNo alerts found'));
        console.log(chalk.cyan('Create an alert: probe alert:create'));
        return;
      }

      const data = [
        ['ID', 'Name', 'Condition', 'Threshold', 'Status'],
        ...alerts.map((alert) => [
          alert.id.substring(0, 8),
          alert.name,
          alert.condition,
          alert.threshold.toString(),
          alert.enabled ? chalk.green('Enabled') : chalk.gray('Disabled'),
        ]),
      ];

      console.log('\n' + table(data));
      console.log(chalk.cyan(`Total: ${alerts.length} alerts`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch alerts'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },

  async create(options: any) {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'program',
          message: 'Program ID:',
          when: !options.program,
        },
        {
          type: 'input',
          name: 'name',
          message: 'Alert name:',
          when: !options.name,
        },
        {
          type: 'list',
          name: 'condition',
          message: 'Condition:',
          choices: [
            'TRANSACTION_FAILURE_RATE',
            'COMPUTE_UNITS_EXCEEDED',
            'TRANSACTION_COUNT_THRESHOLD',
            'CUSTOM_METRIC',
          ],
          when: !options.condition,
        },
        {
          type: 'number',
          name: 'threshold',
          message: 'Threshold value:',
          when: !options.threshold,
        },
        {
          type: 'checkbox',
          name: 'channels',
          message: 'Notification channels:',
          choices: ['EMAIL', 'SLACK', 'DISCORD', 'WEBHOOK'],
        },
      ]);

      const spinner = ora('Creating alert...').start();

      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const alert = await client.createAlert({
        programId: answers.program || options.program,
        name: answers.name || options.name,
        condition: answers.condition || options.condition,
        threshold: parseFloat(answers.threshold || options.threshold),
        comparison: 'GREATER_THAN',
        channels: answers.channels || ['EMAIL'],
      });

      spinner.succeed(chalk.green('Alert created successfully!'));
      console.log(chalk.cyan('\n🔔 Alert Details:'));
      console.log(chalk.white(`ID: ${alert.id}`));
      console.log(chalk.white(`Name: ${alert.name}`));
      console.log(chalk.white(`Condition: ${alert.condition}`));
      console.log(chalk.white(`Threshold: ${alert.threshold}`));
    } catch (error: any) {
      console.error(chalk.red(`\nFailed to create alert: ${error.message}`));
    }
  },

  async delete(id: string) {
    const spinner = ora('Deleting alert...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      await client.deleteAlert(id);
      spinner.succeed(chalk.green('Alert deleted successfully!'));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to delete alert'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },
};
