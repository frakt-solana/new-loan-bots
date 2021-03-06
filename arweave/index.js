import { getMeta } from './lib.js'
import { BinaryReader, BinaryWriter } from 'borsh'
import { PublicKey } from '@solana/web3.js'
import base58 from 'bs58'
;(() => {
  BinaryReader.prototype.readPubkey = function () {
    const reader = this
    const array = reader.readFixedArray(32)
    return new PublicKey(array)
  }

  BinaryWriter.prototype.writePubkey = function (value) {
    const writer = this
    writer.writeFixedArray(value.toBuffer())
  }

  BinaryReader.prototype.readPubkeyAsString = function () {
    const reader = this
    const array = reader.readFixedArray(32)
    return base58.encode(array)
  }

  BinaryWriter.prototype.writePubkeyAsString = function (value) {
    const writer = this
    writer.writeFixedArray(base58.decode(value))
  }
})()

export const getArweaveMetadataByMint = async (tokenMints) => {
  const rawMeta = await getMeta(tokenMints, process.env.RPC_ENDPOINT)

  const metadataByMint =
    rawMeta?.reduce((acc, { mint, metadata, tokenData }) => {
      acc[mint] = {
        ...metadata,
        properties: {
          ...metadata?.properties,
          creators: tokenData?.creators,
        },
      }
      return acc
    }, {}) || {}

  return metadataByMint
}

export * from './arweave.model.js'
