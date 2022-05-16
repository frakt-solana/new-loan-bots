import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import {
  generateCardFile,
  removeCardFile,
  generateCardFilePath,
} from './generateCard/index.js'
import { getArweaveMetadataByMint } from './arweave/index.js'
import { postTweet } from './twitter/index.js'
import { initDiscord } from './discord/index.js'

const postOnDiscord = await initDiscord()

const app = express()
app.use(cors())
app.use(bodyParser.json())

const processedLoans = {
  value: [],
}

app.post('/new-loan', async (req, res) => {
  try {
    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
    } = req.body

    if (processedLoans.value.includes(nftMint)) {
      console.log(`This loan was already processed in last 10 min`)
      return res.send('This loan was already processed in last 10 min')
    }

    processedLoans.value = [...processedLoans.value, nftMint]

    const loanToValueNumber = rawLoanToValue / 100 || 0
    const loanToValue = loanToValueNumber.toString()
    const loanValueNumber = rawLoanValue / 1e9 || 0
    const loanValue = loanValueNumber.toFixed(3)
    const interest = (rawInterest / 100 || 0).toString()
    const nftPrice = (loanValue / (loanToValue / 100)).toFixed(2)
    const period = '7'

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
      period,
      loanToValue,
      loanValue,
      interest,
      nftPrice: nftPrice,
    })

    const cardFilePath = generateCardFilePath(nftMint)

    await generateCardFile(nftMint, {
      nftName,
      nftImageUrl,
      period,
      loanToValue,
      loanValue,
      interest,
      nftPrice,
    })

    await postTweet({
      fullPathToCardImage: cardFilePath,
      nftName,
      nftCollectionName,
      period,
      loanToValue,
      loanValue,
    })
    await postOnDiscord(cardFilePath)

    removeCardFile(nftMint, processedLoans, 10 * 60 * 1000)

    res.send('Success')
  } catch (error) {
    console.error(error)
    res.statusCode = 503
    res.send('Oh shit!')
  }
})

app.listen(8080, function () {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`)
})
