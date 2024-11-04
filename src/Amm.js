import { ComputeBudgetProgram, PublicKey, Keypair, SystemProgram, TransactionInstruction } from "@solana/web3.js"
import bs58 from "bs58"
import BN from "bn.js"
import * as spl from "@solana/spl-token"
import { getRandomJitoAccount, getRandomJitoUrl, sendBundle, createVtxWithOnlyMainSigner, getOwnerAta, feeAccount1, feeAccount2,
programId, getLookupTables, parseSwap, createVtx, jupProgram, wsolMint } from "./common.js"

let balance = 0
let blockhash = null
let lastBlockhashRefresh = 0
const unitPrice = Math.floor((10000 * 1_000_000) / 600_000)
const compute = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice })
const compute2 = ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000})
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms ))



export class Amm {
constructor(connection, payerKeypair) {
this.connection = connection
this.payer = payerKeypair
this.jupiterCache = { buy: null, sell: null, lastUpdateTime: 0, tables: null }
this.initializeBlockhash() }

async initializeBlockhash() {
const response = await this.connection.getLatestBlockhash("finalized")
blockhash = response.blockhash
lastBlockhashRefresh = 0 }

async createFundTx(pubkeys, jitoTipLamports, blockhash) {
const selectedJitoAccount = getRandomJitoAccount()
const accounts = [
{ pubkey: this.payer.publicKey, isSigner: true, isWritable: true },
{ pubkey: pubkeys[0].publicKey, isSigner: false, isWritable: true },
{ pubkey: pubkeys[1].publicKey, isSigner: false, isWritable: true },
{ pubkey: pubkeys[2].publicKey, isSigner: false, isWritable: true },
{ pubkey: pubkeys[3].publicKey, isSigner: false, isWritable: true },
{ pubkey: selectedJitoAccount, isSigner: false, isWritable: true },
{ pubkey: feeAccount1, isSigner: false, isWritable: true },
{ pubkey: feeAccount2, isSigner: false, isWritable: true },
{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false } ]
const jitoTipAmount = jitoTipLamports
const instructionData = Buffer.alloc(9)
new BN(0).toArrayLike(Buffer, 'le', 1).copy(instructionData, 0)
new BN(jitoTipAmount).toArrayLike(Buffer, 'le', 8).copy(instructionData, 1)
const createFundTxIx = new TransactionInstruction({ programId, keys: accounts, data: instructionData })
const vTx = await createVtxWithOnlyMainSigner([compute, compute2, createFundTxIx], this.payer, blockhash)
return vTx }


async createFundSingleTx(pubkey, jitoTipLamports, blockhash) {
const selectedJitoAccount = getRandomJitoAccount()
const accounts = [
{ pubkey: this.payer.publicKey, isSigner: true, isWritable: true },
{ pubkey: pubkey.publicKey, isSigner: false, isWritable: true },
{ pubkey: selectedJitoAccount, isSigner: false, isWritable: true },
{ pubkey: feeAccount1, isSigner: false, isWritable: true },
{ pubkey: feeAccount2, isSigner: false, isWritable: true },
{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false } ]
const jitoTipAmount = jitoTipLamports
const instructionData = Buffer.alloc(9)
new BN(3).toArrayLike(Buffer, 'le', 1).copy(instructionData, 0)
new BN(jitoTipAmount).toArrayLike(Buffer, 'le', 8).copy(instructionData, 1)
const createFundTxIx = new TransactionInstruction({ programId, keys: accounts, data: instructionData })
const vTx = await createVtxWithOnlyMainSigner([compute, compute2, createFundTxIx], this.payer, blockhash)
return vTx }


async swapMakers(direction, mint, signer, blockhash) {
const wSolAta = await getOwnerAta(new PublicKey("So11111111111111111111111111111111111111112"), this.payer.publicKey)
const tokenAta = await getOwnerAta(mint, this.payer.publicKey)
const now = Date.now()

if (!this.jupiterCache.buy || !this.jupiterCache.sell || now - this.jupiterCache.lastUpdateTime > 30000) {
let buyResponse = null
let sellResponse = null
let baseAmount = 1
while ((!buyResponse || !sellResponse) && baseAmount <= 100000) {
try {
buyResponse = await fetch(
`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mint.toString()}&amount=${baseAmount}&slippageBps=10000&swapMode=ExactIn`
).then(res => res.json())
if (buyResponse.error === "Could not find any route") {
buyResponse = null
baseAmount *= 2
console.log(`No buy route found, increasing amount to ${baseAmount}`)
continue
}

outAmount = buyResponse.outAmount
sellResponse = await fetch(
`https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${(baseAmount * 3).toString()}&slippageBps=10000&swapMode=ExactOut`
).then(res => res.json())
if (sellResponse.error === "Could not find any route") {
sellResponse = null
baseAmount *= 2
console.log(`No sell route found, increasing amount to ${baseAmount}`)
continue
}
} catch (e) {
baseAmount *= 2
console.log(`Error finding routes, increasing amount to ${baseAmount}`) } }
if (!buyResponse || !sellResponse) {
throw new Error("Could not find valid routes after multiple attempts") }
console.log(`Found valid routes with buy amount: ${baseAmount}, sell amount: ${baseAmount * 3}`)
balance = await this.connection.getBalance(this.payer.publicKey)
this.jupiterCache.buy = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
method: 'POST',
headers: {'Content-Type': 'application/json'},
body: JSON.stringify({
quoteResponse: buyResponse,
userPublicKey: this.payer.publicKey.toString(),
wrapAndUnwrapSol: false
})}).then(res => res.json())

this.jupiterCache.sell = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
method: 'POST',
headers: { 'Content-Type': 'application/json'},
body: JSON.stringify({
quoteResponse: sellResponse,
userPublicKey: this.payer.publicKey.toString(),
wrapAndUnwrapSol: false,
})
}).then(res => res.json())

this.jupiterCache.lastUpdateTime = now
}

let rawJupResponse
if (direction === "buy") {
rawJupResponse = this.jupiterCache.buy
} else {
rawJupResponse = this.jupiterCache.sell
}
const tables = await getLookupTables(rawJupResponse.addressLookupTableAddresses, this.connection)
const rawSwapIx = rawJupResponse.swapInstruction
const parsedSwapIx = await parseSwap(rawSwapIx)
let instructionData
if (direction === "buy") { instructionData = Buffer.concat([Buffer.from([2]), Buffer.from([1]), Buffer.from(parsedSwapIx.data, 'base64') ]) }
if (direction === "sell") { instructionData = Buffer.concat([Buffer.from([2]), Buffer.from([0]), Buffer.from(parsedSwapIx.data, 'base64') ]) }
let swapIx = new TransactionInstruction({ keys: [ ...parsedSwapIx.keys.map(acc => ({ pubkey: new PublicKey(acc.pubkey), isSigner: acc.isSigner, isWritable: acc.isWritable })),
{ pubkey: signer.publicKey, isSigner: true, isWritable: true },
{ pubkey: this.payer.publicKey, isSigner: true, isWritable: true },
{ pubkey: tokenAta, isSigner: false, isWritable: true },
{ pubkey: wSolAta, isSigner: false, isWritable: true },
{ pubkey: mint, isSigner: false, isWritable: false },
{ pubkey: wsolMint, isSigner: false, isWritable: false },
{ pubkey: feeAccount1, isSigner: false, isWritable: true },
{ pubkey: feeAccount2, isSigner: false, isWritable: true },
{ pubkey: jupProgram, isSigner: false, isWritable: false },
{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
{ pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
{ pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false } ],
programId: programId,
data: instructionData })
const vTx = await createVtx([compute, compute2, swapIx], [signer, this.payer], tables, blockhash)
return vTx }

async makers(mint, totalMakersRequired, options = {}) {
if (!blockhash) { await this.initializeBlockhash() }
const testSend = SystemProgram.transfer({ fromPubkey: this.payer.publicKey, toPubkey: new PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"), lamports: 1 })
const testVtx = await createVtxWithOnlyMainSigner([testSend], this.payer, blockhash)
let testSent = null
try {
testSent = await this.connection.sendRawTransaction(testVtx.serialize(), {skipPreflight: false, preflightCommitment: "finalized"}) }
catch(E) { console.log("Blockhash test failed, try a different commitment or RPC. Your bundles will NOT land right now no matter what size Jito tip.") }
if (testSent) { console.log("Blockhash test OK. Your bundles should land now.") }
let jitoTipLamports = options.jitoTipLamports || 0.0001 * 10 ** 9
let stats = { makersCompleted: 0, makersRemaining: totalMakersRequired, bundleCount: 0, latestBundleId: null }
console.log("Starting makers loop. Total required:", totalMakersRequired)
while (stats.makersCompleted < totalMakersRequired) {
try {
if (stats.bundleCount - lastBlockhashRefresh >= 10) {
blockhash = (await this.connection.getLatestBlockhash("finalized")).blockhash
lastBlockhashRefresh = stats.bundleCount }
const signers = Array(4).fill().map(() => Keypair.generate())
const fundTx = await this.createFundTx(signers, jitoTipLamports, blockhash)//
const firstBuyTx = await this.swapMakers("buy", mint, signers[0], blockhash)
const secondBuyTx = await this.swapMakers("buy", mint, signers[1], blockhash)
const thirdBuyTx = await this.swapMakers("buy", mint, signers[2], blockhash)
const sellTx = await this.swapMakers("buy", mint, signers[3], blockhash)
const send = await sendBundle([
bs58.encode(fundTx.serialize()),
bs58.encode(firstBuyTx.serialize()),
bs58.encode(secondBuyTx.serialize()),
bs58.encode(thirdBuyTx.serialize()),
bs58.encode(sellTx.serialize())], getRandomJitoUrl())
if (send && send.result) {
stats.bundleCount++
stats.latestBundleId = send.result
stats.makersCompleted += 4
stats.makersRemaining = totalMakersRequired - stats.makersCompleted
stats.solBalance = balance / 10 ** 9}
console.log("Stats:", stats)
} catch (err) { console.error("Error in makers:", err) } }
stats['finished'] = true
return stats }

async swapVolume(direction, mint, amount, blockhash, signer) {
    const wSolAta = await getOwnerAta(new PublicKey("So11111111111111111111111111111111111111112"), this.payer.publicKey)
    const tokenAta = await getOwnerAta(mint, this.payer.publicKey)
    let buyIx
    let sellIx
    if (direction === "buy") {
        let buyResponse
        try {
            buyResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mint.toString()}&amount=${amount.toString()}&slippageBps=10000&swapMode=ExactIn`).then(res => res.json())
        } catch(E) { console.log(E.errorCode) }
        if (buyResponse) {
            buyIx = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    quoteResponse: buyResponse,
                    userPublicKey: this.payer.publicKey.toString(),
                    wrapAndUnwrapSol: false
                })
            }).then(res => res.json())
        }
    } else if (direction === "sell") {
        const fixedSellAmount = (amount).toFixed(0)
        const sellResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${fixedSellAmount}&slippageBps=10000&swapMode=ExactOut`).then(res => res.json())
        sellIx = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                quoteResponse: sellResponse,
                userPublicKey: this.payer.publicKey.toString(),
                wrapAndUnwrapSol: false
            })
        }).then(res => res.json())
    }
    let rawJupResponse = direction === "buy" ? buyIx : sellIx
    let tables
    try {
        tables = await getLookupTables(rawJupResponse.addressLookupTableAddresses, this.connection)
    } catch(E) {
        console.log("Error in the amount or possibly unsupported token. Try increasing the amount.")
    }
    if (tables) {
        const rawSwapIx = rawJupResponse.swapInstruction
        const parsedSwapIx = await parseSwap(rawSwapIx)
        let instructionData = Buffer.concat([
            Buffer.from([4]),
            Buffer.from([direction === "buy" ? 1 : 0]),
            Buffer.from(parsedSwapIx.data, 'base64')
        ])
        let swapIx = new TransactionInstruction({
            keys: [
                ...parsedSwapIx.keys.map(acc => ({
                    pubkey: new PublicKey(acc.pubkey),
                    isSigner: acc.isSigner,
                    isWritable: acc.isWritable
                })),
                { pubkey: signer.publicKey, isSigner: true, isWritable: true },
                { pubkey: this.payer.publicKey, isSigner: true, isWritable: true },
                { pubkey: tokenAta, isSigner: false, isWritable: true },
                { pubkey: wSolAta, isSigner: false, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: wsolMint, isSigner: false, isWritable: false },
                { pubkey: feeAccount1, isSigner: false, isWritable: true },
                { pubkey: feeAccount2, isSigner: false, isWritable: true },
                { pubkey: jupProgram, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
            ],
            programId: programId,
            data: instructionData
        })

        const vTx = await createVtx([compute, compute2, swapIx], [signer, this.payer], tables, blockhash)
        return vTx
    }
}

async volume(mint, minSolAmount, maxSolAmount, mCapFactor, speedFactor = 10, options = {}) {
    const jitoTipLamports = options.jitoTipLamports || 0.001 * 10 ** 9
    let totalNetVolume = 0
    let totalRealVolume = 0
    let tradesUntilNextSell = Math.floor(Math.random() * 3) + 1
    let startTime = Date.now()
    let tradeCount = 0
    let buyCount = 0
    let sellCount = 0
    let lastHourlyUpdate = startTime
    const avgSolPerSwap = (minSolAmount + maxSolAmount) / 2
    const avgDelaySeconds = (5000 + 10000/2) / 1000 / speedFactor
    const expectedSwapsPerHour = (3600 / avgDelaySeconds)
    const expectedBuyVolume = expectedSwapsPerHour * avgSolPerSwap
    const avgSellPercentage = (0.5 + (0.5 * 0.5 * (1/mCapFactor)))
    const expectedSellVolume = expectedBuyVolume * avgSellPercentage
    const expectedHourlyVolume = expectedBuyVolume + expectedSellVolume
    console.log(`
Initial Projections (per hour):
Avg Delay Between Trades: ${avgDelaySeconds.toFixed(2)} seconds
Expected Trades: ${expectedSwapsPerHour.toFixed(0)} trades
Expected Buy Volume: ${expectedBuyVolume.toFixed(4)} SOL
Expected Sell Volume: ${expectedSellVolume.toFixed(4)} SOL
Expected Total Volume: ${expectedHourlyVolume.toFixed(4)} SOL
Expected Net Volume: ${(expectedBuyVolume - expectedSellVolume).toFixed(4)} SOL
    `)
    const printHourlyStats = () => {
        const hoursSinceStart = (Date.now() - startTime) / (1000 * 60 * 60)
        const tradesPerHour = tradeCount / hoursSinceStart
        const realVolumePerHour = totalRealVolume / hoursSinceStart
        const netVolumePerHour = totalNetVolume / hoursSinceStart
        console.log(`
=== Hourly Statistics Update ===
Time Running: ${hoursSinceStart.toFixed(2)} hours
Trades Per Hour: ${tradesPerHour.toFixed(1)}
- Buys: ${(buyCount / hoursSinceStart).toFixed(1)}/hour
- Sells: ${(sellCount / hoursSinceStart).toFixed(1)}/hour
Volume Per Hour:
- Real Volume: ${realVolumePerHour.toFixed(4)} SOL/hour
- Net Volume: ${netVolumePerHour.toFixed(4)} SOL/hour
Total Stats:
- Total Trades: ${tradeCount} (${buyCount} buys, ${sellCount} sells)
- Total Real Volume: ${totalRealVolume.toFixed(4)} SOL
- Total Net Volume: ${totalNetVolume.toFixed(4)} SOL
================================
        `)
    }
    while (true) {
        try {
            const now = Date.now()
            if (now - lastHourlyUpdate >= 3600000) {
                printHourlyStats()
                lastHourlyUpdate = now
			}
            if (now - lastBlockhashRefresh > 3000) {
                blockhash = (await this.connection.getLatestBlockhash("finalized")).blockhash
                lastBlockhashRefresh = now
            }
            const signer = Keypair.generate()
            let direction = "buy"
            let amount
            if ((tradesUntilNextSell <= 0 || Math.random() < 0.3) && totalNetVolume > 0) {
                direction = "sell"
                const maxSellPercentage = 1 / mCapFactor
                const sellPercentage = 0.5 + (Math.random() * 0.5 * maxSellPercentage)
                amount = Math.floor(totalNetVolume * sellPercentage * 1000000000)
                tradesUntilNextSell = Math.floor(Math.random() * 3) + 1
                console.log(`
Preparing SELL:
Selling ${(sellPercentage * 100).toFixed(1)}% of net volume
Sell Amount: ${(amount/1000000000).toFixed(4)} SOL
Net Volume: ${totalNetVolume.toFixed(4)} SOL
Total Real Volume: ${totalRealVolume.toFixed(4)} SOL
                `)
            } else {
                direction = "buy"
                amount = Math.floor(
                    (Math.random() * (maxSolAmount - minSolAmount) + minSolAmount)
                    * 1000000000
                )
                tradesUntilNextSell--
                console.log(`
Preparing BUY:
Buy Amount: ${(amount/1000000000).toFixed(4)} SOL
                `)
            }
            const fundTx = await this.createFundSingleTx(signer, jitoTipLamports, blockhash)
            const swapTx = await this.swapVolume(direction, mint, amount, blockhash, signer)
            const bundle = await sendBundle([
                bs58.encode(fundTx.serialize()),
                bs58.encode(swapTx.serialize())
            ], getRandomJitoUrl())
            if (bundle && bundle.result) {
                const solAmount = amount / 1000000000
                tradeCount++
                if (direction === "buy") {
                    totalNetVolume += solAmount
                    buyCount++
                } else {
                    totalNetVolume -= solAmount
                    sellCount++
                }
                totalRealVolume += solAmount
                const tokenBalance = await this.getTokenBalance(mint)
                const solBalance = await this.getSolBalance()
                console.log(`
Trade Complete:
Direction: ${direction}
Amount: ${solAmount.toFixed(4)} SOL
Net Volume: ${totalNetVolume.toFixed(4)} SOL
Total Real Volume: ${totalRealVolume.toFixed(4)} SOL
Trades until next sell: ${tradesUntilNextSell}
Bundle ID: ${bundle.result}
Token Balance: ${tokenBalance.toFixed(4)}
SOL Balance: ${solBalance.toFixed(4)} SOL
                `)
            } else {
                console.log("Bundle failed to land:", bundle)
            }
            const baseDelay = 5000 + Math.random() * 10000
            const adjustedDelay = baseDelay / speedFactor
            await wait(adjustedDelay)
        } catch (err) {
            console.error("Volume test error:", err)
            await wait(5000)
        }
    }
}

async swap(mint, direction, amount, options = {}) {
if (!blockhash) { await this.initializeBlockhash() }
let jitoTipLamports = options.jitoTipLamports || 0.001 * 10 ** 9
try {
const swapIx = await this.swapRegular(direction, mint, amount, blockhash)
const jitoTip = SystemProgram.transfer({ fromPubkey: this.payer.publicKey, toPubkey: getRandomJitoAccount(), lamports: jitoTipLamports })
const jitoTipVtx = await createVtxWithOnlyMainSigner([jitoTip], this.payer, blockhash)
const send = await sendBundle([ bs58.encode(swapIx.serialize()), bs58.encode(jitoTipVtx.serialize()) ], getRandomJitoUrl())
return send } catch (E) {
throw E } }

async getTokenBalance(mint) {
    try {
        const ata = await getOwnerAta(mint, this.payer.publicKey)
        const balance = await this.connection.getTokenAccountBalance(ata)
        return Number(balance.value.amount) / (10 ** balance.value.decimals)
    } catch (e) {
        return 0
    }
}

async getSolBalance() {
    try {
        const balance = await this.connection.getBalance(this.payer.publicKey)
        return balance / 1e9
    } catch (e) {
        return 0
    }
}
}