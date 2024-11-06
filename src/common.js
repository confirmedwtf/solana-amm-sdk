import { PublicKey, TransactionInstruction, VersionedTransaction, TransactionMessage } from "@solana/web3.js"
import * as spl from "@solana/spl-token"

export const dexes = [
"Cropper",
"Raydium",
"Openbook",
"StabbleWeightedSwap",
"Guacswap",
"OpenBookV2",
"Aldrin",
"MeteoraDLMM",
"Saber(Decimals)",
"SanctumInfinity",
"Whirlpool",
"StepN",
"Dexlab",
"RaydiumCP",
"Mercurial",
"LifinityV2",
"ObricV2",
"Meteora",
"Phoenix",
"TokenSwap",
"HeliumNetwork",
"Sanctum",
"Moonshot",
"StabbleStableSwap",
"GooseFX",
"Penguin",
"AldrinV2",
"OrcaV2",
"LifinityV1",
"1DEX",
"CropperLegacy",
"SolFi",
"Oasis",
"Saber",
"Crema",
"Pump.fun",
"RaydiumCLMM",
"Bonkswap",
"Perps",
"Fox",
"Saros",
"OrcaV1",
"FluxBeam",
"Invariant"]

export const jitoAccounts = [
new PublicKey("96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5"),
new PublicKey("HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe"),
new PublicKey("Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY"),
new PublicKey("ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49"),
new PublicKey("DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh"),
new PublicKey("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"),
new PublicKey("DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL"),
new PublicKey("3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT") ]

export const jitoUrls = [
  "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://slc.mainnet.block-engine.jito.wtf/api/v1/bundles" ]

export const feeAccounts = {
  fee1: new PublicKey("BsJVUnreMP9x3hieTGNvfFkgtGWMT5dL2tkNeerY2x6X"),
  fee2: new PublicKey("HkwQG47SYLprat3A2a7zm2PhA4EiqXe4BRGeZFuBJLGB") }

export const wsolMint = new PublicKey("So11111111111111111111111111111111111111112")
export const jupProgram = new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")

export const feeAccount1 = new PublicKey("BsJVUnreMP9x3hieTGNvfFkgtGWMT5dL2tkNeerY2x6X")
export const feeAccount2 = new PublicKey("HkwQG47SYLprat3A2a7zm2PhA4EiqXe4BRGeZFuBJLGB")

export const programId = new PublicKey("ammm1g4BXHiRCo3XtUxdTxm4jm5tzqSV6nMK1K52H6W")

export const getRandomJitoAccount = () => jitoAccounts[Math.floor(Math.random() * jitoAccounts.length)]
export const getRandomJitoUrl = () => jitoUrls[Math.floor(Math.random() * jitoUrls.length)]

export async function sendBundle(bundled, url) {
  const data = {
    jsonrpc: "2.0",
    id: 1,
    method: "sendBundle",
    params: [bundled]
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return await res.json()
}

export async function getOwnerAta(mint, owner) {
const foundAta = PublicKey.findProgramAddressSync( [owner.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];
return foundAta }

export async function getLookupTables(tables, connection) {
const lookupTables = []
if (!tables) { tables = [] }
if (tables && tables.length === 0) { return([]) }
for (const table of tables) {
const lookupTable = await connection.getAddressLookupTable(new PublicKey(table))
lookupTables.push(lookupTable.value) }
return(lookupTables) }

export async function parseSwap(rawSwap) {
let accountMetas = []
let ixData
let programId
for (const account of rawSwap.accounts) {
accountMetas.push({pubkey: new PublicKey(account.pubkey), isSigner: account.isSigner, isWritable: account.isWritable})  }
ixData = Buffer.from(rawSwap.data, "base64")
programId = new PublicKey(rawSwap.programId)
const swapIx = new TransactionInstruction({keys: accountMetas, programId, data: ixData})
return(swapIx) }

export async function createVtxWithOnlyMainSigner(ixs, wallet, blockhash) {
    if (!blockhash || typeof blockhash !== 'string') {
        throw new Error('Invalid blockhash provided to createVtxWithOnlyMainSigner');
    }

    const msg = new TransactionMessage({
        payerKey: wallet.publicKey,
        instructions: ixs,
        recentBlockhash: blockhash
    }).compileToV0Message([]);

    const vTx = new VersionedTransaction(msg);
    vTx.sign([wallet]);
    return vTx;
}

export async function createVtx(ixs, wallets, tables, blockhash) {
    const msg = new TransactionMessage({
        payerKey: wallets[0].publicKey,
        instructions: ixs,
        recentBlockhash: blockhash
    }).compileToV0Message(tables)
    const vTx = new VersionedTransaction(msg)
    vTx.sign(wallets)
    return vTx
}

export async function createVtxWithOnlyMainSignerAndTables(ixs, wallet, tables, blockhash) {
    const msg = new TransactionMessage({
        payerKey: wallet.publicKey,
        instructions: ixs,
        recentBlockhash: blockhash
    }).compileToV0Message(tables)
    const vTx = new VersionedTransaction(msg)
    vTx.sign([wallet])
    return vTx
}
