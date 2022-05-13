import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import { generateCardFile, removeCardFile } from './generateCard/index.js'
import { getArweaveMetadataByMint } from './arweave/index.js'
import { postTweet } from './twitter/index.js'
import { initDiscord } from './discord/index.js'

const postOnDiscord = await initDiscord()

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/new-loan', async (req, res) => {
  try {
    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
    } = req.body

    const loanToValue = rawLoanToValue / 100 || 0
    const loanValue = rawLoanValue / 1e9 || 0
    const interest = rawInterest / 100 || 0
    const nftPrice = loanValue / (loanToValue / 100)
    const period = 7

    const nftMetadataByMint = await getArweaveMetadataByMint([nftMint])
    const metadata = nftMetadataByMint[nftMint]

    const nftImageUrl = metadata?.image || ''
    const nftName = metadata?.name || ''
    const nftCollectionName = metadata?.collection?.name || ''

    console.log('Loan data: ', {
      nftMint,
      nftName,
      nftImageUrl,
      nftCollectionName,
      period: period.toString(),
      loanToValue: loanToValue.toString(),
      loanValue: loanValue.toFixed(3),
      interest: interest.toString(),
      nftPrice: nftPrice.toFixed(2),
    })

    const { cardFileName, fullPath } = await generateCardFile(nftMint, {
      nftName,
      nftImageUrl,
      period: period.toString(),
      loanToValue: loanToValue.toString(),
      loanValue: loanValue.toFixed(3),
      interest: interest.toString(),
      nftPrice: nftPrice.toFixed(2),
    })

    await postTweet({
      fullPathToCardImage: fullPath,
      nftName,
      nftCollectionName,
      period,
      loanToValue,
      loanValue,
    })
    await postOnDiscord(fullPath)

    await removeCardFile(nftMint)

    console.log(`${cardFileName} removed`)

    res.send('Posted successfully')
  } catch (error) {
    console.error(error)
    res.statusCode = 503
    res.send('Oh shit!')
  }
})

app.listen(8080, function () {
  console.log('Server is listening')
})
