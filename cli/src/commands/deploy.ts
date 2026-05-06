import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';

interface DeployOptions {
  network?: string;
  keypair?: string;
}

export const deployCommands = {
  async deploy(options: DeployOptions) {
    const spinner = ora('Deploying Probe instrumentation contract...').start();

    try {
      // Determine network
      const network = options.network || 'devnet';
      const rpcUrl = getRpcUrl(network);
      const connection = new Connection(rpcUrl, 'confirmed');

      // Load keypair
      const keypair = await loadKeypair(options.keypair);
      
      spinner.text = `Using wallet: ${keypair.publicKey.toString()}`;

      // Check balance
      const balance = await connection.getBalance(keypair.publicKey);
      const balanceInSol = balance / 1e9;
      
      if (balanceInSol < 0.1) {
        spinner.fail(chalk.red(`Insufficient balance: ${balanceInSol} SOL`));
        console.log(chalk.yellow(`\nYou need at least 0.1 SOL to deploy.`));
        
        if (network === 'devnet') {
          console.log(chalk.cyan(`\nGet devnet SOL from: https://faucet.solana.com`));
          console.log(chalk.cyan(`Your wallet: ${keypair.publicKey.toString()}`));
        }
        
        return;
      }

      spinner.text = `Balance: ${balanceInSol.toFixed(4)} SOL`;

      // Note: Actual deployment would require compiled program
      // This is a placeholder showing the deployment process
      
      spinner.succeed(chalk.green('Deployment process initiated'));
      
      console.log(chalk.cyan('\n📋 Deployment Summary:'));
      console.log(chalk.white(`Network: ${network}`));
      console.log(chalk.white(`RPC URL: ${rpcUrl}`));
      console.log(chalk.white(`Deployer: ${keypair.publicKey.toString()}`));
      console.log(chalk.white(`Balance: ${balanceInSol.toFixed(4)} SOL`));
      
      console.log(chalk.yellow('\n⚠️  Note: To complete deployment, you need:'));
      console.log(chalk.white('1. Compiled Solana program (.so file)'));
      console.log(chalk.white('2. Run: solana program deploy <program.so>'));
      console.log(chalk.white('3. Or use Anchor: anchor deploy'));
      
      console.log(chalk.cyan('\n📚 Documentation:'));
      console.log(chalk.white('- Solana CLI: https://docs.solana.com/cli/deploy-a-program'));
      console.log(chalk.white('- Anchor: https://www.anchor-lang.com/docs/cli'));
      
      console.log(chalk.green('\n✅ Wallet verified and ready for deployment!'));

    } catch (error: any) {
      spinner.fail(chalk.red('Deployment failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      
      if (error.message.includes('Invalid')) {
        console.log(chalk.yellow('\n💡 Tip: Check your keypair file format'));
      }
    }
  },
};

function getRpcUrl(network: string): string {
  const urls: Record<string, string> = {
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
  };
  
  return urls[network] || urls.devnet;
}

async function loadKeypair(keypairPath?: string): Promise<Keypair> {
  // Try to load from provided path
  if (keypairPath) {
    const fullPath = path.resolve(keypairPath);
    if (fs.existsSync(fullPath)) {
      const keypairData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      return Keypair.fromSecretKey(Uint8Array.from(keypairData));
    }
    throw new Error(`Keypair file not found: ${fullPath}`);
  }

  // Try to load from .env
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const privateKeyMatch = envContent.match(/SOLANA_WALLET_PRIVATE_KEY=\[(.*?)\]/);
    
    if (privateKeyMatch) {
      const privateKeyArray = privateKeyMatch[1].split(',').map(n => parseInt(n.trim()));
      return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    }
  }

  // Try default Solana CLI location
  const defaultPath = path.join(process.env.HOME || '', '.config', 'solana', 'id.json');
  if (fs.existsSync(defaultPath)) {
    const keypairData = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(keypairData));
  }

  throw new Error('No keypair found. Provide --keypair or set SOLANA_WALLET_PRIVATE_KEY in .env');
}
