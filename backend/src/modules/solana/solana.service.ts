import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private connections: Map<string, Connection> = new Map();
  private defaultNetwork: string;
  
  // Rate limiting configuration
  private readonly MAX_CONCURRENT_REQUESTS = 1; // Only 1 request at a time (safest)
  private readonly REQUEST_DELAY_MS = 500; // 500ms delay between requests (balanced)
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 2000; // 2 seconds
  
  // Custom rate limiter implementation (no external dependencies)
  private activeRequests = 0;
  private requestQueue: Array<() => void> = [];
  
  // Track request counts for logging
  private requestCount = 0;
  private lastResetTime = Date.now();
  private lastRequestTime = 0;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.defaultNetwork = this.configService.get('SOLANA_NETWORK') || 'devnet';
    
    // Initialize connections for all networks
    this.initializeConnection('mainnet-beta', 
      'https://api.mainnet-beta.solana.com',
      'wss://api.mainnet-beta.solana.com'
    );
    
    this.initializeConnection('devnet',
      this.configService.get('SOLANA_RPC_URL') || 'https://api.devnet.solana.com',
      this.configService.get('SOLANA_WS_URL') || 'wss://api.devnet.solana.com'
    );
    
    this.initializeConnection('testnet',
      'https://api.testnet.solana.com',
      'wss://api.testnet.solana.com'
    );

    this.logger.log(`✅ Initialized Solana connections for all networks (default: ${this.defaultNetwork})`);
    this.logger.log(`🔒 Rate limiting: ${this.MAX_CONCURRENT_REQUESTS} concurrent, ${this.REQUEST_DELAY_MS}ms delay`);
    
    // Reset request counter every minute for logging
    setInterval(() => {
      if (this.requestCount > 0) {
        const elapsed = (Date.now() - this.lastResetTime) / 1000;
        this.logger.debug(`📊 Requests in last ${elapsed.toFixed(0)}s: ${this.requestCount} (${(this.requestCount / elapsed).toFixed(2)}/s)`);
      }
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }, 60000);
  }

  private initializeConnection(network: string, rpcUrl: string, wsUrl: string) {
    this.logger.log(`Initializing ${network} connection: ${rpcUrl}`);
    
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: wsUrl,
    });
    
    this.connections.set(network, connection);
  }

  getConnection(network?: string): Connection {
    const networkKey = this.normalizeNetwork(network || this.defaultNetwork);
    const connection = this.connections.get(networkKey);
    
    if (!connection) {
      this.logger.warn(`Connection for ${networkKey} not found, using default`);
      return this.connections.get(this.defaultNetwork)!;
    }
    
    return connection;
  }

  getWsConnection(network?: string): Connection {
    return this.getConnection(network);
  }

  private normalizeNetwork(network: string): string {
    // Convert database enum to network key
    const networkMap: Record<string, string> = {
      'MAINNET_BETA': 'mainnet-beta',
      'mainnet-beta': 'mainnet-beta',
      'mainnet': 'mainnet-beta',
      'DEVNET': 'devnet',
      'devnet': 'devnet',
      'TESTNET': 'testnet',
      'testnet': 'testnet',
    };
    
    return networkMap[network] || 'devnet';
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Custom rate limiter - waits until a slot is available
   */
  private async acquireSlot(): Promise<void> {
    // Wait for available slot
    while (this.activeRequests >= this.MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => {
        this.requestQueue.push(resolve as () => void);
      });
    }
    
    // Enforce minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY_MS) {
      await this.delay(this.REQUEST_DELAY_MS - timeSinceLastRequest);
    }
    
    this.activeRequests++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Release a slot and process queue
   */
  private releaseSlot(): void {
    this.activeRequests--;
    
    // Process next queued request
    const next = this.requestQueue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.MAX_RETRIES,
    delayMs = this.INITIAL_RETRY_DELAY,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Check if it's a rate limit error
      const is429 = error?.message?.includes('429') || 
                    error?.message?.includes('Too Many Requests') ||
                    error?.message?.includes('max usage reached');
      
      if (is429 && retries > 0) {
        this.logger.warn(`⚠️  Rate limited, retrying in ${delayMs}ms (${retries} retries left)`);
        await this.delay(delayMs);
        return this.retryWithBackoff(fn, retries - 1, delayMs * 2); // Exponential backoff
      }
      
      throw error;
    }
  }

  /**
   * Rate-limited request wrapper
   */
  private async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    
    try {
      this.requestCount++;
      return await this.retryWithBackoff(fn);
    } finally {
      this.releaseSlot();
    }
  }

  async getTransaction(signature: string, network?: string): Promise<ParsedTransactionWithMeta | null> {
    try {
      return await this.rateLimitedRequest(async () => {
        const connection = this.getConnection(network);
        return await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
      });
    } catch (error) {
      this.logger.error(`Error fetching transaction ${signature} on ${network}:`, error.message);
      return null;
    }
  }

  async getTransactionBatch(signatures: string[], network?: string): Promise<(ParsedTransactionWithMeta | null)[]> {
    try {
      // Process in small batches with rate limiting to avoid 429 errors
      const BATCH_SIZE = 10; // Process 10 at a time (increased from 5)
      const results: (ParsedTransactionWithMeta | null)[] = [];
      
      for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
        const batch = signatures.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(sig => this.getTransaction(sig, network))
        );
        
        results.push(...batchResults);
        
        // Log progress for large batches
        if (signatures.length > BATCH_SIZE) {
          this.logger.debug(`📦 Processed ${Math.min(i + BATCH_SIZE, signatures.length)}/${signatures.length} transactions`);
        }
        
        // Add delay between batches to avoid overwhelming RPC (reduced from 2s to 1s)
        if (i + BATCH_SIZE < signatures.length) {
          await this.delay(1000); // 1 second delay between batches
        }
      }
      
      return results;
    } catch (error) {
      this.logger.error(`Error fetching transaction batch on ${network}:`, error.message);
      return [];
    }
  }

  async getSignaturesForAddress(address: string, options: any, network?: string) {
    try {
      return await this.rateLimitedRequest(async () => {
        const connection = this.getConnection(network);
        const publicKey = new PublicKey(address);
        return await connection.getSignaturesForAddress(publicKey, options);
      });
    } catch (error) {
      this.logger.error(`Error fetching signatures for ${address} on ${network}:`, error.message);
      return [];
    }
  }

  async subscribeToProgram(
    programId: string,
    callback: (accountInfo: any) => void,
    network?: string,
  ): Promise<number> {
    const connection = this.getWsConnection(network);
    const publicKey = new PublicKey(programId);
    
    return connection.onProgramAccountChange(
      publicKey,
      (accountInfo) => {
        callback(accountInfo);
      },
      'confirmed',
    );
  }

  async unsubscribe(subscriptionId: number, network?: string): Promise<void> {
    const connection = this.getWsConnection(network);
    await connection.removeProgramAccountChangeListener(subscriptionId);
  }

  async getAccountInfo(address: string, network?: string) {
    try {
      return await this.rateLimitedRequest(async () => {
        const connection = this.getConnection(network);
        const publicKey = new PublicKey(address);
        return await connection.getAccountInfo(publicKey);
      });
    } catch (error) {
      this.logger.error(`Error fetching account info for ${address} on ${network}:`, error.message);
      return null;
    }
  }

  async getSlot(network?: string): Promise<number> {
    return this.rateLimitedRequest(async () => {
      const connection = this.getConnection(network);
      return await connection.getSlot();
    });
  }

  async getBlockTime(slot: number, network?: string): Promise<number | null> {
    return this.rateLimitedRequest(async () => {
      const connection = this.getConnection(network);
      return await connection.getBlockTime(slot);
    });
  }

  async isValidAddress(address: string): Promise<boolean> {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}
