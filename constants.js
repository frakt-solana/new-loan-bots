import { PublicKey, Connection } from '@solana/web3.js'
import anchor from '@project-serum/anchor'
import { returnAnchorProgram } from '@frakters/nft-lending-v2'

import { createFakeWallet } from './helpers.js'

const { Provider } = anchor

export const wallet = createFakeWallet()

export const connection = new Connection(process.env.RPC_ENDPOINT)

export const provider = new Provider(connection, wallet, null)

export const loansProgram = new PublicKey(
  'ESuQdAjueJSARPYsUZnB7nxbWKEPU8ynkRWLrFrGZsLi'
)

export const anchorWrappedProgram = returnAnchorProgram(loansProgram, provider)
