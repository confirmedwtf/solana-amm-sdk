import { Connection, Keypair, PublicKey } from "@solana/web3.js";

/**
 * Automated Market Maker class for Solana tokens
 */
export class Amm {
  connection: Connection;
  payer: Keypair;
  jupiterCache: {
    buy: any | null;
    sell: any | null;
    lastUpdateTime: number;
    tables: any | null;
  };

  /**
   * Creates a new AMM instance
   * @param connection - Solana RPC connection
   * @param payerKeypair - Keypair for the payer account
   */
  constructor(connection: Connection, payerKeypair: Keypair);

  /**
   * Creates maker orders for a token
   * @param mint - Token mint public key
   * @param numberOfMakers - Number of maker orders to create
   * @param options - Optional configuration parameters
   * @returns Promise resolving to maker creation statistics
   */
  makers(
    mint: PublicKey,
    numberOfMakers: number,
    options?: {
      jitoTipLamports?: number;
      onlyBuys?: boolean;
    }
  ): Promise<{
    makersCompleted: number;
    makersRemaining: number;
    bundleCount: number;
    latestBundleId: string | null;
    solBalance?: number;
    finished: boolean;
  }>;

  /**
   * Generates trading volume for a token
   * @param mint - Token mint public key
   * @param minimumSolPerSwap - Minimum SOL per swap
   * @param maximumSolPerSwap - Maximum SOL per swap
   * @param mCapFactor - Market cap factor to control price impact
   * @param speedFactor - Speed factor to control trading frequency
   * @param options - Optional configuration parameters
   * @returns Promise resolving to volume statistics
   */
  volume(
    mint: PublicKey,
    minimumSolPerSwap: number,
    maximumSolPerSwap: number,
    mCapFactor: number,
    speedFactor?: number,
    options?: {
      jitoTipLamports?: number;
    }
  ): Promise<{
    mint: PublicKey;
    swapsCompleted: number;
    totalVolume: number;
  }>;

  /**
   * Get token balance for an account
   * @param mint - Token mint public key
   * @returns Promise resolving to token balance
   */
  getTokenBalance(mint: PublicKey): Promise<number>;

  /**
   * Get SOL balance for the payer account
   * @returns Promise resolving to SOL balance
   */
  getSolBalance(): Promise<number>;
}

export default Amm;
