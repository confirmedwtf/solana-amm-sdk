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

// setup
const connection = new Connection("https://lauraine-qytyxk-fast-mainnet.helius-rpc.com/")
const payerWallet = Keypair.fromSecretKey(Uint8Array.from([/* your keypair */]))
const mint = new PublicKey("CqMLnuQ8bVSiak5crmhA3PCrwwtKi7R5VzcxJDKArfYN")

const amm = new Amm(connection, payerWallet, {disableLogs: true})

const minSolPerSwap = 0.001
const maxSolPerSwap = 0.002
const mCapFactor = 1
const speedFactor = 1
await amm.volume(mint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, {includeDexes: ["Raydium"], jitoTipLamports: 100000})

await amm.makers(mint, 5000, {includeDexes: ["Raydium"], jitoTipLamports: 100000 })

const swap = await amm.swap(mint, "buy", 0.001, {jitoTipLamports: 100000})
```

## Features

- 🚀 Easy to use
- 📈 Customizable volume generation
- ⚡ Jito MEV protection
- 🔧 Select which Dex to include

## Documentation

For detailed documentation, visit [docs.confirmed.wtf](https://docs.confirmed.wtf)

## Support

- 🐛 [Report Issues](https://github.com/confirmedwtf/solana-amm-sdk/issues)
- 💬 [Join Discord](https://discord.gg/confirmedwtf)
- 📚 [Read Docs](https://docs.confirmed.wtf)

## License

MIT License - see [LICENSE](LICENSE) for details