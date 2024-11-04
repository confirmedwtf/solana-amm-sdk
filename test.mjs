import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import Amm from "@confirmedwtf/solana-amm-sdk"
import bs58 from "bs58"

// setup
const connection = new Connection("https://lauraine-qytyxk-fast-mainnet.helius-rpc.com/")
const payerWallet = Keypair.fromSecretKey(Uint8Array.from(/* Your keypair */))
// if you need to use a phantom style base58 string private key:
// const payerWallet = Keypair.fromSecretKey(bs58.decode(/* Your private key */))
const mint = new PublicKey("Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs")

// create amm instance
const amm = new Amm(connection, payerWallet)

// do makers
await amm.makers(mint, 5000, { jitoTipLamports: 10000 })

// do volume
const minSolPerSwap = 0.005 // sol per swap
const maxSolPerSwap = 0.006 // sol per swap
const mCapFactor = 1 // adjust this to make chart go up. higher number = higher chart, you just are left over with some tokens that you can sell after.
const speedFactor = 1  // adjust this value to control swap frequency
await amm.volume(mint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, {jitoTipLamports: 100000}) // Jito tip defaults to 10000 lamports if omitted
