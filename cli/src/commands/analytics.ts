import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ProbeClient } from '@probe/sdk';
import { getConfig } from '../utils/config';

export const analyticsCommands = {
  async get(programId: string, options: any) {
    const spinner = ora('Fetching analytics...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const analytics = await client.getAnalytics(programId, {
        startDate: options.start,
        endDate: options.end,
      });

      spinner.stop();

      if (analytics.length === 0) {
        console.log(chalk.yellow('\nNo analytics data found'));
        return;
      }

      const data = [
        ['Time', 'Transactions', 'Success', 'Failed', 'Avg Compute Units'],
        ...analytics.slice(0, 20).map((metric) => [
          new Date(metric.hour).toLocaleString(),
          metric.txCount.toString(),
          chalk.green(metric.successCount.toString()),
          chalk.red(metric.failureCount.toString()),
          metric.avgComputeUnits ? metric.avgComputeUnits.toFixed(0) : 'N/A',
        ]),
      ];

      console.log('\n' + table(data));
      console.log(chalk.cyan(`Showing ${Math.min(20, analytics.length)} of ${analytics.length} data points`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch analytics'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },

  async trends(programId: string) {
    const spinner = ora('Fetching trends...').start();

    try {
      const config = getConfig();
      const client = new ProbeClient({
        apiUrl: config.apiUrl,
        accessToken: config.accessToken,
      });

      const trends = await client.getTrends(programId);
      spinner.stop();

      console.log(chalk.cyan('\n📈 Trends:'));
      console.log(chalk.white(`Transaction Growth: ${trends.transactionGrowth > 0 ? chalk.green('+') : chalk.red('')}${trends.transactionGrowth}%`));
      console.log(chalk.white(`Success Rate Trend: ${trends.successRateTrend > 0 ? chalk.green('+') : chalk.red('')}${trends.successRateTrend}%`));
      console.log(chalk.white(`Avg Compute Units: ${trends.avgComputeUnitsTrend > 0 ? chalk.green('+') : chalk.red('')}${trends.avgComputeUnitsTrend}%`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch trends'));
      console.error(chalk.red(`Error: ${error.message}`));
    }
  },
};
