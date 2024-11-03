import { Connection, Keypair, PublicKey } from "@solana/web3.js";

/**
 * Automated Market Maker class for Solana tokens
 */
export class Amm {
  /**
   * Creates a new AMM instance
   * @param connection - Solana RPC connection
   * @param payerKeypair - Keypair for the payer account
   */
  constructor(connection: Connection, payerKeypair: Keypair);

  /**
   * Creates maker orders for a token
   * @param mint - Token mint public key
   * @param numberOfMakers - Optional number of maker orders to create
   * @returns Promise resolving to number of makers created
   */
  makers(
    mint: PublicKey,
    numberOfMakers?: number
  ): Promise<number>;

  /**
   * Generates trading volume for a token
   * @param mint - Token mint public key
   * @param minimumSolPerSwap - Minimum SOL per swap
   * @param maximumSolPerSwap - Maximum SOL per swap
   * @param swapsPerHour - Target number of swaps per hour
   * @param hoursToRun - Duration to run in hours
   * @returns Promise resolving to volume statistics
   */
  volume(
    mint: PublicKey,
    minimumSolPerSwap: number,
    maximumSolPerSwap: number,
    swapsPerHour: number,
    hoursToRun: number
  ): Promise<{
    mint: PublicKey;
    swapsCompleted: number;
    totalVolume: number;
  }>;
}

export default Amm;
