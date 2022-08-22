import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

import { initDiscord, createPostOnDiscordChannel } from './discord/index.js';
import { generateCardFilePath } from './generateCard/index.js';
import { getNftMetadataByMint } from './helpers.js';
import { generateLoanCardFile, generateRaffleCardFile, removeCardFile } from './generateCard/index.js';
import { postTweet } from './twitter/index.js';

dotenv.config();
await initDiscord();

export const SHORT_TERM = 'short-term'
export const LONG_TERM = 'long-term'

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/new-loan-price', async (req, res) => {
  console.log('Price loan:', req.body);

  const {
    nftMint,
    loanToValue: rawLoanToValue,
    loanValue: rawLoanValue,
    interest: rawInterest,
  } = req.body;

  const loanToValueNumber = rawLoanToValue / 100 || 0;
  const loanToValue = loanToValueNumber.toString();
  const loanValueNumber = rawLoanValue / 1e9 || 0;
  const loanValue = loanValueNumber.toFixed(3);
  const interest = (rawInterest / 100 || 0).toString();
  const nftPrice = (loanValue / (loanToValue / 100)).toFixed(2);

  const { nftImageUrl, nftName, nftCollectionName } = await getNftMetadataByMint(nftMint);
  const cardFilePath = generateCardFilePath(nftMint);

  await generateLoanCardFile(nftMint, {
    nftName,
    nftImageUrl,
    loanToValue: Number(loanToValue).toFixed(),
    loanValue,
    interest,
    nftPrice,
    loansType: LONG_TERM,
  });

  await postTweet({
    fullPathToCardImage: cardFilePath,
    nftName,
    nftCollectionName,
    loanToValue,
    loanValue,
    loansType: LONG_TERM,
  });

  await createPostOnDiscordChannel(process.env.DISCORD_EVENTS_CHANNEL_ID, cardFilePath)
  await removeCardFile(nftMint, 60 * 1000);

  res.end();
});

app.post('/new-loan-time', async (req, res) => {
  console.log('Time loan:', req.body);

  const {
    nftMint,
    loanToValue: rawLoanToValue,
    loanValue: rawLoanValue,
    interest: rawInterest,
    period: rawPeriod,
  } = req.body;

  const loanToValueNumber = rawLoanToValue / 100 || 0;
  const loanToValue = loanToValueNumber.toString();
  const loanValueNumber = rawLoanValue / 1e9 || 0;
  const loanValue = loanValueNumber.toFixed(3);
  const interest = (rawInterest / 100 || 0).toString();
  const nftPrice = (loanValue / (loanToValue / 100)).toFixed(2);
  const period = rawPeriod ? rawPeriod.toString() : '7';

  const { nftImageUrl, nftName, nftCollectionName } = await getNftMetadataByMint(nftMint);
  const cardFilePath = generateCardFilePath(nftMint);

  await generateLoanCardFile(nftMint, {
    nftName,
    nftImageUrl,
    period,
    loanToValue: Number(loanToValue).toFixed(),
    loanValue,
    interest,
    nftPrice,
    loansType: SHORT_TERM,
  });

  await postTweet({
    fullPathToCardImage: cardFilePath,
    nftName,
    nftCollectionName,
    period,
    loanToValue,
    loanValue,
    loansType: SHORT_TERM,
  });

  await createPostOnDiscordChannel(process.env.DISCORD_EVENTS_CHANNEL_ID, cardFilePath);
  await removeCardFile(nftMint, 60 * 1000);

  res.end();
});

app.post('/new-raffle', async (req, res) => {
  console.log('Raffle data:', req.body);

  const {
    nftMint,
    rawBuyoutPrice,
    rawFloorPrice,
  } = req.body;

  const buyoutPrice = Number(rawBuyoutPrice / 1e9 || 0).toFixed(3);
  const floorPrice = Number(rawFloorPrice / 1e9 || 0).toFixed(3);

  const { nftImageUrl, nftName, nftCollectionName } = await getNftMetadataByMint(nftMint);
  const cardFilePath = generateCardFilePath(nftMint);

  await generateRaffleCardFile(nftMint, { nftName, nftImageUrl, buyoutPrice, floorPrice });
  await postTweet({ fullPathToCardImage: cardFilePath, nftName, nftCollectionName });
  await createPostOnDiscordChannel(process.env.DISCORD_LIQUIDATIONS_CHANNEL_ID, cardFilePath);
  await removeCardFile(nftMint, 60 * 1000);

  res.end();
});

app.listen(8080, () => {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`);
});
