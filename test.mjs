import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { Amm } from "./src/Amm.js"
//import { Amm } from "./src/Amm.js"
// import bs58 from "bs58"

// setup
const connection = new Connection("https://lauraine-qytyxk-fast-mainnet.helius-rpc.com/")
const payerWallet = Keypair.fromSecretKey(Uint8Array.from([12,87,27,189,105,116]))
// if you need to use a phantom style base58 string private key:
// const payerWallet = Keypair.fromSecretKey(bs58.decode(/* Your private key */))
const mint = new PublicKey("GDfnEsia2WLAW5t8yx2X5j2mkfA74i5kwGdDuZHt7XmG")

// optional disableLogs param. If no disableLogs is provided, logs will be shown.
const amm = new Amm(connection, payerWallet, {disableLogs: false})

// volume generation
const minSolPerSwap = 0.0010011 // sol per swap
const maxSolPerSwap = 0.00211 // sol per swap
const mCapFactor = 1 // adjust this to make chart go up. higher number = higher chart, you just are left over with some tokens that you can sell after.
const speedFactor = 1  // Adjust this value to control trading frequency

// If you want to use a specific Dex, add it like this: {includeDexes: ["Whirlpool"]}. If no includeDexes is provided, all DEXes will be used.
await amm.volume(mint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, {includeDexes: ["Whirlpool"], jitoTipLamports: 100000})

// makers
await amm.makers(mint, 5000, {includeDexes: ["Whirlpool"], jitoTipLamports: 100000 })

// single swap not fully implemented yet
///const swap = await amm.swap(mint, "sell", 2, {jitoTipLamports: 100000})
