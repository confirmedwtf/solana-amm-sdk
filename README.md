# Solana AMM SDK

A powerfully simple SDK for market making on Solana.

## Installation

```bash
npm install @confirmedwtf/solana-amm-sdk
```

## Usage

```javascript
import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { Amm } from "@confirmedwtf/solana-amm-sdk"

const connection = new Connection("https://lauraine-qytyxk-fast-mainnet.helius-rpc.com/")
const payerWallet = Keypair.fromSecretKey(Uint8Array.from(/* Your keypair */))
const mint = new PublicKey("Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs")

const amm = new Amm(connection, payerWallet)

await amm.makers(mint, 5000, { jitoTipLamports: 10000 })

const minSolPerSwap = 0.005
const maxSolPerSwap = 0.006
const mCapFactor = 1
const speedFactor = 1
await amm.volume(mint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, {jitoTipLamports: 100000})
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