import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { Amm } from "@confirmedwtf/solana-amm-sdk"
//import { Amm } from "./src/Amm.js"
// import bs58 from "bs58"

// setup
const connection = new Connection("https://lauraine-qytyxk-fast-mainnet.helius-rpc.com/")
const payerWallet = Keypair.fromSecretKey(Uint8Array.from(/* your keypair */))
// if you need to use a phantom style base58 string private key:
// const payerWallet = Keypair.fromSecretKey(bs58.decode(/* Your private key */))
const mint = new PublicKey("HUmZBfWc5VqWPPiQ9tCjCLjMao2PDXCYQoY3vcB8pump")

// optional disableLogs param. If no disableLogs is provided, logs will be shown.
const amm = new Amm(connection, payerWallet, {disableLogs: true})

// volume generation
const minSolPerSwap = 0.001 // sol per swap
const maxSolPerSwap = 0.002 // sol per swap
const mCapFactor = 1 // adjust this to make chart go up. higher number = higher chart, you just are left over with some tokens that you can sell after.
const speedFactor = 1  // Adjust this value to control trading frequency
// If you want to include a specific DEX, you can add the optional includeDexes parameter. If no includeDexes is provided, all DEXes will be used.
await amm.volume(mint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, {includeDexes: ["Raydium"], jitoTipLamports: 100000})

// makers spam
await amm.makers(mint, 5000, {includeDexes: ["Raydium"], jitoTipLamports: 100000 })

// single swap
const swap = await amm.swap(mint, "buy", 0.001, {jitoTipLamports: 100000})
