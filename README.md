# Solana AMM SDK

A powerfully simple SDK for market making on Solana.

## Installation

```bash
npm install @confirmedwtf/solana-amm-sdk
```

## Usage

```javascript
import { Amm } from '@confirmedwtf/solana-amm-sdk';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// Initialize connection and wallet
const connection = new Connection("YOUR_RPC_URL");
const wallet = Keypair.fromSecretKey(/* your keypair */);
const tokenMint = new PublicKey("YOUR_TOKEN_MINT");

// Create AMM instance
const amm = new Amm(connection, wallet);

// Create makers
await amm.makers(
    tokenMint,
    500,                    // Creates 500 makers
    { jitoTipLamports: 10001 }
);

// Generate volume
await amm.volume(
    tokenMint,
    0.005,                 // Minimum SOL per swap
    0.006,                 // Maximum SOL per swap
    1,                     // Market cap factor (Higher = chart goes up, 0 = neutral)
    1,                     // Speed factor (Controls trading frequency)
    { jitoTipLamports: 1000 }
);
```

## Features

- 🚀 Easy to use
- 📈 Customizable volume generation
- ⚡ Jito MEV protection
- 🔧 Flexible configuration

## Documentation

For detailed documentation, visit [docs.confirmed.wtf](https://docs.confirmed.wtf)

## Support

- 🐛 [Report Issues](https://github.com/confirmedwtf/solana-amm-sdk/issues)
- 💬 [Join Discord](https://discord.gg/confirmedwtf)
- 📚 [Read Docs](https://docs.confirmed.wtf)

## License

MIT License - see [LICENSE](LICENSE) for details
