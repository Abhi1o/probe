import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaService } from '../solana/solana.service';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

export interface OwnershipVerificationResult {
  isOwner: boolean;
  method: 'upgrade_authority' | 'signature' | 'deployment_history' | 'none';
  upgradeAuthority?: string;
  verifiedAt: Date;
  details?: string;
}

@Injectable()
export class OwnershipVerificationService {
  private readonly logger = new Logger(OwnershipVerificationService.name);

  constructor(private solanaService: SolanaService) {}

  /**
   * Verify program ownership using multiple methods
   */
  async verifyOwnership(
    programId: string,
    walletAddress: string,
    signature?: string,
    message?: string,
  ): Promise<OwnershipVerificationResult> {
    try {
      // Method 1: Check upgrade authority
      const authorityCheck = await this.verifyUpgradeAuthority(programId, walletAddress);
      if (authorityCheck.isOwner) {
        return authorityCheck;
      }

      // Method 2: Verify wallet signature (if provided)
      if (signature && message) {
        const signatureCheck = await this.verifyWalletSignature(
          walletAddress,
          message,
          signature,
        );
        if (signatureCheck.isOwner) {
          // Still need to check if they have some connection to the program
          const hasConnection = await this.checkProgramConnection(programId, walletAddress);
          if (hasConnection) {
            return {
              ...signatureCheck,
              details: 'Verified via wallet signature and program connection',
            };
          }
        }
      }

      // Method 3: Check deployment history
      const deploymentCheck = await this.verifyDeploymentHistory(programId, walletAddress);
      if (deploymentCheck.isOwner) {
        return deploymentCheck;
      }

      // No ownership found
      return {
        isOwner: false,
        method: 'none',
        verifiedAt: new Date(),
        details: 'No ownership verification method succeeded',
      };
    } catch (error) {
      this.logger.error(`Error verifying ownership: ${error.message}`);
      throw new BadRequestException('Failed to verify program ownership');
    }
  }

  /**
   * Method 1: Verify upgrade authority
   */
  private async verifyUpgradeAuthority(
    programId: string,
    walletAddress: string,
  ): Promise<OwnershipVerificationResult> {
    try {
      const connection = this.solanaService.getConnection();
      const programPubkey = new PublicKey(programId);

      // Get program account info
      const programAccount = await connection.getAccountInfo(programPubkey);
      
      if (!programAccount) {
        return {
          isOwner: false,
          method: 'upgrade_authority',
          verifiedAt: new Date(),
          details: 'Program account not found',
        };
      }

      // Check if program is upgradeable (owned by BPF Upgradeable Loader)
      const BPF_UPGRADEABLE_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';
      const isUpgradeable = programAccount.owner.toString() === BPF_UPGRADEABLE_LOADER;

      if (!isUpgradeable) {
        return {
          isOwner: false,
          method: 'upgrade_authority',
          verifiedAt: new Date(),
          details: 'Program is not upgradeable (immutable)',
        };
      }

      // Get ProgramData account address
      const [programDataAddress] = PublicKey.findProgramAddressSync(
        [programPubkey.toBuffer()],
        new PublicKey(BPF_UPGRADEABLE_LOADER),
      );

      // Get ProgramData account
      const programDataAccount = await connection.getAccountInfo(programDataAddress);
      
      if (!programDataAccount) {
        return {
          isOwner: false,
          method: 'upgrade_authority',
          verifiedAt: new Date(),
          details: 'ProgramData account not found',
        };
      }

      // Parse upgrade authority from ProgramData account
      // Layout: [4 bytes slot] + [1 byte option] + [32 bytes authority]
      const upgradeAuthorityOption = programDataAccount.data[4];
      
      if (upgradeAuthorityOption === 0) {
        return {
          isOwner: false,
          method: 'upgrade_authority',
          verifiedAt: new Date(),
          details: 'Program upgrade authority has been revoked (immutable)',
        };
      }

      const upgradeAuthorityBytes = programDataAccount.data.slice(5, 37);
      const upgradeAuthority = new PublicKey(upgradeAuthorityBytes).toString();

      const isOwner = upgradeAuthority === walletAddress;

      return {
        isOwner,
        method: 'upgrade_authority',
        upgradeAuthority,
        verifiedAt: new Date(),
        details: isOwner 
          ? 'Wallet is the upgrade authority' 
          : `Upgrade authority is ${upgradeAuthority}`,
      };
    } catch (error) {
      this.logger.error(`Error checking upgrade authority: ${error.message}`);
      return {
        isOwner: false,
        method: 'upgrade_authority',
        verifiedAt: new Date(),
        details: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Method 2: Verify wallet signature
   */
  private async verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string,
  ): Promise<OwnershipVerificationResult> {
    try {
      // Decode signature and public key
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);

      // Verify signature
      const messageBytes = new TextEncoder().encode(message);
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes,
      );

      return {
        isOwner: isValid,
        method: 'signature',
        verifiedAt: new Date(),
        details: isValid 
          ? 'Wallet signature verified successfully' 
          : 'Invalid wallet signature',
      };
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`);
      return {
        isOwner: false,
        method: 'signature',
        verifiedAt: new Date(),
        details: `Signature verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Method 3: Verify deployment history
   */
  private async verifyDeploymentHistory(
    programId: string,
    walletAddress: string,
  ): Promise<OwnershipVerificationResult> {
    try {
      const connection = this.solanaService.getConnection();
      const walletPubkey = new PublicKey(walletAddress);

      // Get signatures for the wallet
      const signatures = await connection.getSignaturesForAddress(walletPubkey, {
        limit: 1000, // Check last 1000 transactions
      });

      // Look for program deployment transactions
      for (const sig of signatures) {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) continue;

        // Check if transaction involves the program
        const accountKeys = tx.transaction.message.getAccountKeys();
        const programInvolved = accountKeys.staticAccountKeys.some(
          key => key.toString() === programId,
        );

        if (programInvolved) {
          // Check if this was a deployment transaction
          const isDeployment = tx.meta?.logMessages?.some(
            log => log.includes('Program log: Deployed') || 
                   log.includes('BPFLoaderUpgradeab1e'),
          );

          if (isDeployment) {
            return {
              isOwner: true,
              method: 'deployment_history',
              verifiedAt: new Date(),
              details: `Found deployment transaction: ${sig.signature}`,
            };
          }
        }
      }

      return {
        isOwner: false,
        method: 'deployment_history',
        verifiedAt: new Date(),
        details: 'No deployment transactions found in wallet history',
      };
    } catch (error) {
      this.logger.error(`Error checking deployment history: ${error.message}`);
      return {
        isOwner: false,
        method: 'deployment_history',
        verifiedAt: new Date(),
        details: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Check if wallet has any connection to the program
   */
  private async checkProgramConnection(
    programId: string,
    walletAddress: string,
  ): Promise<boolean> {
    try {
      const connection = this.solanaService.getConnection();
      const walletPubkey = new PublicKey(walletAddress);

      // Check recent transactions
      const signatures = await connection.getSignaturesForAddress(walletPubkey, {
        limit: 100,
      });

      // Look for any interaction with the program
      for (const sig of signatures) {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) continue;

        const accountKeys = tx.transaction.message.getAccountKeys();
        const hasInteraction = accountKeys.staticAccountKeys.some(
          key => key.toString() === programId,
        );

        if (hasInteraction) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking program connection: ${error.message}`);
      return false;
    }
  }

  /**
   * Get program upgrade authority
   */
  async getUpgradeAuthority(programId: string): Promise<string | null> {
    try {
      const result = await this.verifyUpgradeAuthority(programId, '');
      return result.upgradeAuthority || null;
    } catch (error) {
      this.logger.error(`Error getting upgrade authority: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate verification message for wallet signing
   */
  generateVerificationMessage(programId: string, walletAddress: string): string {
    const timestamp = Date.now();
    return `Verify ownership of Solana program ${programId} for wallet ${walletAddress} at ${timestamp}`;
  }
}
