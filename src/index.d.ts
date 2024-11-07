import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export interface AmmOptions {
  disableLogs?: boolean;
}

export interface MakerOptions {
  jitoTipLamports?: number;
  includeDexes?: string[];
}

export interface VolumeOptions {
  jitoTipLamports?: number;
  includeDexes?: string[];
}

export interface SwapOptions {
  jitoTipLamports?: number;
  includeDexes?: string[];
}

export interface MakerStats {
  makersCompleted: number;
  makersRemaining: number;
  bundleCount: number;
  latestBundleId: string | null;
  solBalance?: number;
  finished: boolean;
}

export interface JupiterCache {
  buy: any | null;
  sell: any | null;
  lastUpdateTime: number;
  tables: any | null;
}

/**
 * Automated Market Maker class for Solana tokens
 */
export class Amm {
  connection: Connection;
  payer: Keypair;
  jupiterCache: JupiterCache;
  disableLogs: boolean;

  /**
   * Creates a new AMM instance
   * @param connection - Solana RPC connection
   * @param payerKeypair - Keypair for the payer account
   * @param options - Optional configuration parameters
   */
  constructor(connection: Connection, payerKeypair: Keypair, options?: AmmOptions);

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
    options?: MakerOptions
  ): Promise<MakerStats>;

  /**
   * Generates trading volume for a token
   * @param mint - Token mint public key
   * @param minimumSolPerSwap - Minimum SOL per swap
   * @param maximumSolPerSwap - Maximum SOL per swap
   * @param mCapFactor - Market cap factor to control price impact
   * @param speedFactor - Speed factor to control trading frequency
   * @param options - Optional configuration parameters
   */
  volume(
    mint: PublicKey,
    minimumSolPerSwap: number,
    maximumSolPerSwap: number,
    mCapFactor: number,
    speedFactor?: number,
    options?: VolumeOptions
  ): Promise<void>;

  /**
   * Executes a single swap
   * @param mint - Token mint public key
   * @param direction - Swap direction ("buy" or "sell")
   * @param amount - Amount to swap in SOL
   * @param options - Optional configuration parameters
   */
  swap(
    mint: PublicKey,
    direction: "buy" | "sell",
    amount: number,
    options?: SwapOptions
  ): Promise<void>;

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

  /**
   * Internal logging method
   * @param args - Arguments to log
   */
  private log(...args: any[]): void;
}

export default Amm;
