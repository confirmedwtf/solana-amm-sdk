# Solana AMM SDK - beta

A professional Automated Market Maker (AMM) SDK for Solana, leveraging Jito's infrastructure for optimal performance and efficiency.
Usually code that is able to generate volume and unique makers is complex and hard to understand. 
This SDK is designed to be easy to understand and use.

## Features

- Simplified and efficient bundle creation and management
- Leverage Jito bundles to execute thousands of high-frequency buy and sell transactions per minute, each from unique wallets
- Utilize Jito bundles to generate substantial trading volume, ensuring each transaction originates from a distinct wallet
- Comprehensive AMM protocol support including:
  - Raydium
  - Orca
  - Meteora
  - Pump.fun
  - Moonshot
- Regular maintenance and feature updates
- Production-ready implementation

## Installation

```bash
npm install @confirmedwtf/solana-amm-sdk
```

## Usage

### ESM (recommended)
```javascript
import { Amm } from '@confirmedwtf/solana-amm-sdk';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const connection = new Connection("YOUR_RPC_URL");
const wallet = Keypair.fromSecretKey(/* your keypair */);
const tokenMint = new PublicKey("YOUR_TOKEN_MINT");

const amm = new Amm(connection, wallet);

// Create makers
await amm.makers(tokenMint, 500, {jitoTipLamports: 10001}); // Creates 500 makers

// Generate volume
const minSolPerSwap = 0.005; // Minimum SOL per swap
const maxSolPerSwap = 0.006; // Maximum SOL per swap
const mCapFactor = 1; // Higher = chart goes up, 0 = neutral
const speedFactor = 1; // Controls trading frequency

await amm.volume( tokenMint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, { jitoTipLamports: 1000 });
```

### CommonJS
```javascript
const { Amm } = require('solana-amm-sdk');
// rest of the code is the same as the above
```

## API Reference

### `new Amm(connection, payerKeypair)`
Creates a new AMM instance.

- `connection`: Solana RPC connection
- `payerKeypair`: Keypair for the payer account

### `makers(mint, numberOfMakers?)`
Creates makers for a token.

- `mint`: PublicKey of the token mint
- `numberOfMakers`: Number of makers to create

### `volume(mint, minimumSolPerSwap, maximumSolPerSwap, mCapFactor, speedFactor, options?)`
Generates trading volume for a token.

- `mint`: PublicKey of the token mint
- `minimumSolPerSwap`: Minimum SOL per swap
- `maximumSolPerSwap`: Maximum SOL per swap
- `mCapFactor`: Market cap factor (higher = chart go up, 0 = neutral (same buy amounts as sell amounts))
- `speedFactor`: Controls trading frequency
- `options`: Optional configuration
  - `jitoTipLamports`: Amount of lamports for Jito tip (default: 10000 if empty)

## License

MIT License

## Support and Contact

- Documentation: [Documentation](https://docs.confirmed.wtf)
- GitHub Issues: [Report a bug](https://github.com/confirmedwtf/solana-amm-sdk/issues)
- Discord: [Join our community](https://discord.gg/confirmedwtf)
