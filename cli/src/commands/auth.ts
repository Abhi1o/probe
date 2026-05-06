import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ProbeClient } from '@probe/sdk';
import { getConfig, saveConfig, clearConfig } from '../utils/config';

export const authCommands = {
  async login() {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Email:',
          validate: (input) => input.includes('@') || 'Please enter a valid email',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:',
          mask: '*',
        },
      ]);

      const spinner = ora('Logging in...').start();

      const config = getConfig();
      const client = new ProbeClient({ apiUrl: config.apiUrl });
      
      const response = await client.login(answers.email, answers.password);
      
      saveConfig({
        ...config,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });

      spinner.succeed(chalk.green('Login successful!'));
      console.log(chalk.cyan(`\nWelcome, ${response.user.name}!`));
      console.log(chalk.white(`Email: ${response.user.email}`));
      console.log(chalk.white(`Role: ${response.user.role}`));
    } catch (error: any) {
      console.error(chalk.red(`\nLogin failed: ${error.message}`));
      process.exit(1);
    }
  },

  async logout() {
    clearConfig();
    console.log(chalk.green('✓ Logged out successfully'));
  },

  async whoami() {
    const config = getConfig();
    
    if (!config.user) {
      console.log(chalk.yellow('Not logged in'));
      console.log(chalk.cyan('\nRun: probe login'));
      return;
    }

    console.log(chalk.cyan('\n👤 Current User:'));
    console.log(chalk.white(`Name: ${config.user.name}`));
    console.log(chalk.white(`Email: ${config.user.email}`));
    console.log(chalk.white(`Role: ${config.user.role}`));
    console.log(chalk.white(`ID: ${config.user.id}`));
  },
};
