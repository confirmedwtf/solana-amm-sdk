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
constructor(connection, payerKeypair, options = {}) {
this.connection = connection
this.payer = payerKeypair
this.jupiterCache = { buy: null, sell: null, lastUpdateTime: 0, tables: null }
this.disableLogs = options.disableLogs || false
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


async swapMakers(direction, mint, signer, blockhash, excludes) {
    const wSolAta = await getOwnerAta(new PublicKey("So11111111111111111111111111111111111111112"), this.payer.publicKey)
    const tokenAta = await getOwnerAta(mint, this.payer.publicKey)
    const now = Date.now()
    let baseAmount = 5

    if (!this.jupiterCache.buy || !this.jupiterCache.sell || now - this.jupiterCache.lastUpdateTime > 10000) {
        let buyResponse = null
        let sellResponse = null
        let outAmount = null

        while ((!buyResponse || !sellResponse) && baseAmount <= 100000) {
            try {
                // Try buy route
                if (!buyResponse) {
                    const buyUrl = excludes && excludes.length > 0
                        ? `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mint.toString()}&amount=${baseAmount}&onlyDirectRoutes=true&directRoutesOnly=true&dexes=${excludes}&slippageBps=10000&swapMode=ExactIn`
                        : `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mint.toString()}&amount=${baseAmount}&onlyDirectRoutes=true&directRoutesOnly=true&slippageBps=10000&swapMode=ExactIn`

                    const buyResult = await fetch(buyUrl).then(res => res.json())

                    if (!buyResult.error) {
                        buyResponse = buyResult
                        outAmount = buyResult.outAmount
                        this.log(`Found valid buy route at ${baseAmount} lamports`)
                    } else {
                        this.log(`No buy route at ${baseAmount} lamports: ${buyResult.error}`)
                    }
                }

                // Try sell route if we have a buy route
                if (buyResponse && !sellResponse && outAmount) {
                    const sellAmount = (outAmount * 3).toString()
                    const sellUrl = excludes && excludes.length > 0
                        ? `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${sellAmount}&onlyDirectRoutes=true&directRoutesOnly=true&dexes=${excludes}&slippageBps=10000&swapMode=ExactIn`
                        : `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${sellAmount}&onlyDirectRoutes=true&directRoutesOnly=true&slippageBps=10000&swapMode=ExactIn`

                    const sellResult = await fetch(sellUrl).then(res => res.json())

                    if (!sellResult.error) {
                        sellResponse = sellResult
                        this.log(`Found valid sell route at ${sellAmount} tokens`)
                    } else {
                        this.log(`No sell route at ${sellAmount} tokens: ${sellResult.error}`)
                        // Reset buy response since we need to try a different amount
                        buyResponse = null
                        outAmount = null
                    }
                }

                // If either route is missing, increase the base amount
                if (!buyResponse || !sellResponse) {
                    baseAmount *= 2
                    this.log(`Increasing base amount to ${baseAmount} lamports`)
                }

            } catch (e) {
                this.log(`Error finding routes: ${e.message}`)
                baseAmount *= 2
                this.log(`Increasing base amount to ${baseAmount} lamports`)
            }
        }

        if (!buyResponse || !sellResponse) {
            throw new Error("Could not find valid routes after multiple attempts")
        }

        this.log(`Successfully found both routes:
• Buy amount: ${baseAmount} lamports
• Sell amount: ${outAmount * 3} tokens`)

        balance = await this.connection.getBalance(this.payer.publicKey)

        // Cache the routes
        this.jupiterCache.buy = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                quoteResponse: buyResponse,
                userPublicKey: this.payer.publicKey.toString(),
                wrapAndUnwrapSol: false
            })
        }).then(res => res.json())

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

    let rawJupResponse = direction === "buy" ? this.jupiterCache.buy : this.jupiterCache.sell
    const tables = await getLookupTables(rawJupResponse.addressLookupTableAddresses, this.connection)
    const rawSwapIx = rawJupResponse.swapInstruction
    const parsedSwapIx = await parseSwap(rawSwapIx)
    let amountBuffer = Buffer.alloc(8)
    new BN(baseAmount.toString()).toArrayLike(Buffer, 'le', 8).copy(amountBuffer, 0)
    let instructionData
    if (direction === "buy") {
        instructionData = Buffer.concat([Buffer.from([2]), Buffer.from([1]), amountBuffer, Buffer.from(parsedSwapIx.data, 'base64') ])
    }
    if (direction === "sell") {
        instructionData = Buffer.concat([Buffer.from([2]), Buffer.from([0]), amountBuffer, Buffer.from(parsedSwapIx.data, 'base64') ])
    }
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

async makers(mint, totalMakersRequired, options = {}) {
    const includeDexes = options.includeDexes || []
    let dexes = includeDexes.length > 0 ? includeDexes.join(",") : ""
    const solBalance = await this.getSolBalance()
    const jitoTipLamports = options.jitoTipLamports || 0.0001 * 10 ** 9

    // Initial setup logging
    console.log(`
=== Makers Bot Configuration ===
Token: ${mint.toString()}
Wallet: ${this.payer.publicKey.toString()}
SOL Balance: ${solBalance.toFixed(4)} SOL

Parameters:
• Total Makers Required: ${totalMakersRequired}
• Jito Tip: ${jitoTipLamports/1e9} SOL
${includeDexes.length > 0 ? `• Enabled DEXes: ${includeDexes.join(", ")}` : '• Using all available DEXes'}
===========================
`)

    if (!blockhash) { await this.initializeBlockhash() }

    // Test blockhash
    const testSend = SystemProgram.transfer({
        fromPubkey: this.payer.publicKey,
        toPubkey: new PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"),
        lamports: 1
    })
    const testVtx = await createVtxWithOnlyMainSigner([testSend], this.payer, blockhash)

    try {
        await this.connection.sendRawTransaction(testVtx.serialize(), {
            skipPreflight: false,
            preflightCommitment: "finalized"
        })
        console.log("✓ Blockhash test successful - bundles should land")
    } catch(E) {
        console.log("✗ Blockhash test failed - try a different RPC endpoint")
        return
    }

    let stats = {
        makersCompleted: 0,
        makersRemaining: totalMakersRequired,
        bundleCount: 0,
        latestBundleId: null
    }

    console.log("\nStarting makers loop...")

    while (stats.makersCompleted < totalMakersRequired) {
        try {
            if (stats.bundleCount - lastBlockhashRefresh >= 10) {
                blockhash = (await this.connection.getLatestBlockhash("finalized")).blockhash
                lastBlockhashRefresh = stats.bundleCount
            }

            const signers = Array(4).fill().map(() => Keypair.generate())
            const fundTx = await this.createFundTx(signers, jitoTipLamports, blockhash)
            const firstBuyTx = await this.swapMakers("buy", mint, signers[0], blockhash, dexes)
            const secondBuyTx = await this.swapMakers("buy", mint, signers[1], blockhash, dexes)
            const thirdBuyTx = await this.swapMakers("buy", mint, signers[2], blockhash, dexes)
            const sellTx = await this.swapMakers("buy", mint, signers[3], blockhash, dexes)

            const bundle = await sendBundle([
                bs58.encode(fundTx.serialize()),
                bs58.encode(firstBuyTx.serialize()),
                bs58.encode(secondBuyTx.serialize()),
                bs58.encode(thirdBuyTx.serialize()),
                bs58.encode(sellTx.serialize())
            ], getRandomJitoUrl())

            if (bundle && bundle.result) {
                stats.bundleCount++
                stats.latestBundleId = bundle.result
                stats.makersCompleted += 4
                stats.makersRemaining = totalMakersRequired - stats.makersCompleted
                const currentSolBalance = await this.getSolBalance()

                console.log(`
[${new Date().toLocaleTimeString()}] Bundle #${stats.bundleCount}
• Makers Added: 4
• Progress: ${stats.makersCompleted}/${totalMakersRequired}
• Remaining: ${stats.makersRemaining}
• SOL Balance: ${currentSolBalance.toFixed(4)} SOL
• Bundle: ${bundle.result}`)
            }
        } catch (err) {
            console.error("Error in makers:", err.message)
            await wait(5000)
        }
    }

    console.log(`
=== Makers Complete ===
• Total Bundles: ${stats.bundleCount}
• Total Makers: ${stats.makersCompleted}
• Final SOL Balance: ${(await this.getSolBalance()).toFixed(4)} SOL
==================
`)

    stats['finished'] = true
    return stats
}

async swapVolume(direction, mint, amount, blockhash, signer, excludes) {
    const wSolAta = await getOwnerAta(new PublicKey("So11111111111111111111111111111111111111112"), this.payer.publicKey)
    const tokenAta = await getOwnerAta(mint, this.payer.publicKey)
    let buyIx
    let sellIx
    if (direction === "buy") {
        let buyResponse
		let buyUrl
        try {
			if (excludes && excludes.length > 0) {
				buyUrl = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mint.toString()}&amount=${amount.toString()}&onlyDirectRoutes=true&directRoutesOnly=true&dexes=${excludes}&slippageBps=10000&swapMode=ExactIn`
			} else {
				buyUrl = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mint.toString()}&amount=${amount.toString()}&onlyDirectRoutes=true&directRoutesOnly=true&slippageBps=10000&swapMode=ExactIn`
			}
           buyResponse = await fetch(buyUrl).then(res => res.json())
} catch(E) { this.log(E.errorCode) }
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
		let sellUrl
		try {
		if (excludes && excludes.length > 0) {
			sellUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${fixedSellAmount}&onlyDirectRoutes=true&directRoutesOnly=true&dexes=${excludes}&slippageBps=10000&swapMode=ExactOut`
		} else {
			sellUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${fixedSellAmount}&onlyDirectRoutes=true&directRoutesOnly=true&slippageBps=10000&swapMode=ExactOut`
		}	 } catch {}
        const sellResponse = await fetch(sellUrl).then(res => res.json())
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
        this.log("Error in the amount or possibly unsupported token. Try increasing the amount.")
    }
    if (tables) {
        const rawSwapIx = rawJupResponse.swapInstruction
        const parsedSwapIx = await parseSwap(rawSwapIx)
        let amountBuffer = Buffer.alloc(8)
        new BN(amount.toString()).toArrayLike(Buffer, 'le', 8).copy(amountBuffer, 0)
        let instructionData = Buffer.concat([
            Buffer.from([4]),
            Buffer.from([direction === "buy" ? 1 : 0]),
			amountBuffer,
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
    const includeDexes = options.includeDexes || []
    let dexes = includeDexes.length > 0 ? includeDexes.join(",") : ""
    const jitoTipLamports = options.jitoTipLamports || 0.001 * 10 ** 9
    const solBalance = await this.getSolBalance()

    const avgSolPerSwap = (minSolAmount + maxSolAmount) / 2
    const avgDelaySeconds = (5000 + 10000/2) / 1000 / speedFactor
    const expectedSwapsPerHour = (3600 / avgDelaySeconds)
    const expectedBuyVolume = expectedSwapsPerHour * avgSolPerSwap
    const avgSellPercentage = (0.5 + (0.5 * 0.5 * (1/mCapFactor)))
    const expectedSellVolume = expectedBuyVolume * avgSellPercentage
    const expectedHourlyVolume = expectedBuyVolume + expectedSellVolume

    console.log(`
=== Volume Bot Configuration ===
Token: ${mint.toString()}
Wallet: ${this.payer.publicKey.toString()}
SOL Balance: ${solBalance.toFixed(4)} SOL

Parameters:
• Speed Factor: ${speedFactor}x
• Market Cap Factor: ${mCapFactor}x
• Min SOL/Swap: ${minSolAmount} SOL
• Max SOL/Swap: ${maxSolAmount} SOL
• Jito Tip: ${jitoTipLamports/1e9} SOL
${includeDexes.length > 0 ? `• Enabled DEXes: ${includeDexes.join(", ")}` : '• Using all available DEXes'}

Hourly Projections:
• Expected Swaps: ${expectedSwapsPerHour.toFixed(0)}
• Expected Volume: ${expectedHourlyVolume.toFixed(4)} SOL
• Expected Net Volume: ${(expectedBuyVolume - expectedSellVolume).toFixed(4)} SOL
• Average Delay: ${avgDelaySeconds.toFixed(1)} seconds
===========================
`)

    let totalNetVolume = 0
    let totalRealVolume = 0
    let tradesUntilNextSell = Math.floor(Math.random() * 3) + 1
    let startTime = Date.now()
    let tradeCount = 0

    while (true) {
        try {
            blockhash = (await this.connection.getLatestBlockhash("finalized")).blockhash
            const signer = Keypair.generate()

            const shouldSell = (tradesUntilNextSell <= 0 || Math.random() < 0.3) && totalNetVolume > 0
            let direction = shouldSell ? "sell" : "buy"
            let amount

            if (shouldSell) {
                const maxSellPercentage = 1 / mCapFactor
                const sellPercentage = 0.5 + (Math.random() * 0.5 * maxSellPercentage)
                amount = Math.floor(totalNetVolume * sellPercentage * 1000000000)
                tradesUntilNextSell = Math.floor(Math.random() * 3) + 1
            } else {
                amount = Math.floor(
                    (Math.random() * (maxSolAmount - minSolAmount) + minSolAmount)
                    * 1000000000
                )
                tradesUntilNextSell--
            }

            const fundTx = await this.createFundSingleTx(signer, jitoTipLamports, blockhash)
            const swapTx = await this.swapVolume(direction, mint, amount, blockhash, signer, dexes)
            const bundle = await sendBundle([
                bs58.encode(fundTx.serialize()),
                bs58.encode(swapTx.serialize())
            ], getRandomJitoUrl())

            if (bundle && bundle.result) {
                const solAmount = amount / 1000000000
                tradeCount++
                if (direction === "buy") {
                    totalNetVolume += solAmount
                } else {
                    totalNetVolume -= solAmount
                }
                totalRealVolume += solAmount

                const runTime = ((Date.now() - startTime) / (1000 * 60)).toFixed(1)
                const currentSolBalance = await this.getSolBalance()
                console.log(`
[${new Date().toLocaleTimeString()}] Trade #${tradeCount}
• Direction: ${direction.toUpperCase()}
• Amount: ${solAmount.toFixed(4)} SOL
• Net Volume: ${totalNetVolume.toFixed(4)} SOL
• Total Volume: ${totalRealVolume.toFixed(4)} SOL
• SOL Balance: ${currentSolBalance.toFixed(4)} SOL
• Runtime: ${runTime} minutes
• Bundle: ${bundle.result}`)
            }

            const baseDelay = 5000 + Math.random() * 10000
            const adjustedDelay = baseDelay / speedFactor
            await wait(adjustedDelay)
        } catch (err) {
            console.error("Error:", err.message)
            await wait(5000)
        }
    }
}

async swap(mint, direction, amount, options = {}) {
const signer = Keypair.generate()
if (!blockhash) { await this.initializeBlockhash() }
let jitoTipLamports = options.jitoTipLamports || 0.001 * 10 ** 9
try {
const fundTx = await this.createFundSingleTx(signer, jitoTipLamports, blockhash)
const swapIx = await this.swapVolume(direction, mint, amount * 10 ** 9, blockhash, signer)
const send = await sendBundle([ bs58.encode(fundTx.serialize()), bs58.encode(swapIx.serialize()) ], getRandomJitoUrl())
return } catch (E) {
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

log(...args) {
    if (!this.disableLogs) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}]`, ...args);
    }
}
}