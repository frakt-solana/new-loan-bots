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
import { postTweet } from './twitter/index.js'
import { initDiscord, createPostOnDiscordChannel } from './discord/index.js'
import { getNftMetadataByMint } from './helpers.js'

await initDiscord();

const app = express()
app.use(cors())
app.use(bodyParser.json())

const processedLoans = {
  value: [],
};

export const SHORT_TERM = 'short-term'
export const LONG_TERM = 'long-term'

const generateAndPostCardFile = async ({
  nftMint,
  rawLoanToValue,
  rawLoanValue,
  rawInterest,
  rawPeriod,
  loansType,
  res,
}) => {
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
  const period = rawPeriod ? rawPeriod.toString() : '7'

  const { nftImageUrl, nftName, nftCollectionName } =
    await getNftMetadataByMint(nftMint)

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

  if (!nftImageUrl || !nftName) {
    console.log(`This nft has broken metadata`)
    return res.send('This nft has broken metadata')
  }

  const cardFilePath = generateCardFilePath(nftMint)

  await generateCardFile(nftMint, {
    nftName,
    nftImageUrl,
    period,
    loanToValue,
    loanValue,
    interest,
    nftPrice,
    loansType,
  });

  await postTweet({
    fullPathToCardImage: cardFilePath,
    nftName,
    nftCollectionName,
    period,
    loanToValue,
    loanValue,
    loansType,
  })
  await createPostOnDiscordChannel(cardFilePath)

  await removeCardFile(nftMint, processedLoans, 10 * 60 * 1000)
}

app.post('/new-loan-price', async (req, res) => {
  try {
    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
    } = req.body

    await generateAndPostCardFile({
      nftMint,
      rawLoanToValue,
      rawLoanValue,
      rawInterest,
      loansType: LONG_TERM,
      res,
    })
  } catch (error) {
    console.error(error)
    res.statusCode = 503
    res.send('Oh shit!')
  }
})

app.post('/new-loan-time', async (req, res) => {
  try {
    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
      period: rawPeriod,
    } = req.body

    await generateAndPostCardFile({
      nftMint,
      rawLoanToValue,
      rawLoanValue,
      rawInterest,
      rawPeriod,
      loansType: SHORT_TERM,
    })
  } catch (error) {
    console.error(error)
    res.statusCode = 503
    res.send('Oh shit!')
  }
})

app.listen(8080, function () {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`)
})
