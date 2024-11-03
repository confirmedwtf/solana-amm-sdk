# Solana AMM SDK - beta

A powerfully simple SDK to make tokens top trending via market making on Solana.

## Features
- Cheap, fast, easy
- Generate configurable randomized trading volume
- Works for Pump.fun tokens, Moonshot, Raydium, Orca, Meteora, etc.
- Constant updates and improvements
- Use this SDK for things like TG bots, swap widgets, etc, and use your own address to collect a fee via jup. (Adding this soon).

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
await amm.makers(tokenMint, 500, {jitoTipLamports: 100001}); // Creates 500 makers

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
MIT