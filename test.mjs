import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import Amm from "./src/Amm.js"
import bs58 from "bs58"


// setup
const connection = new Connection("YOUR_RPC_URL")
const payerWallet = Keypair.fromSecretKey(Uint8Array.from( [/* Your keypair */] ))
// const jupFeeAddress = new PublicKey("YOUR_JUP_FEE_ADDRESS")
// const feeBPS = 100 // 1%
// jup referral program not yet fully implemented, check back later today or tomorrow.

// if you need to use a phantom style base58 string private key:
// const payerWallet = Keypair.fromSecretKey(bs58.decode(/* Your private key */))

const mint = new PublicKey("YOUR_TOKEN_MINT")


// makers
const amm = new Amm(connection, payerWallet)
await amm.makers(mint, 5000, {jitoTipLamports: 100001})


// volume
const minSolPerSwap = 0.005 // sol per swap
const maxSolPerSwap = 0.006 // sol per swap
const mCapFactor = 1 // adjust this to make chart go up. higher number = higher chart, you just are left over with some tokens that you can sell after.
const speedFactor = 1  // Adjust this value to control trading frequency
await amm.volume(mint, minSolPerSwap, maxSolPerSwap, mCapFactor, speedFactor, {jitoTipLamports: 300001}) // higher mCap factor = chart goes up. 0 = no increase or decrease - net neutral.
