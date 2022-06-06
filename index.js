import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  generateCardFile,
  removeCardFile,
  generateCardFilePath,
} from './generateCard/index.js';
import { getArweaveMetadataByMint } from './arweave/index.js';
import { postTweet } from './twitter/index.js'
import { initDiscord } from './discord/index.js'
import { nftLending } from '@frakters/frakt-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const postOnDiscord = await initDiscord()

dotenv.config();

const NFT_LENDING_PROGRAM_ID = new PublicKey(
  'A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ'
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const processedLoans = {
  value: [],
};

const liquidationAlerts = {
  value: [],
};

app.post('/new-loan', async (req, res) => {
  try {
    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
      period: rawPeriod,
    } = req.body;

    if (processedLoans.value.includes(nftMint)) {
      console.log('This loan was already processed in last 10 min');
      return res.send('This loan was already processed in last 10 min');
    }

    processedLoans.value = [...processedLoans.value, nftMint];

    const loanToValueNumber = rawLoanToValue / 100 || 0;
    const loanToValue = loanToValueNumber.toString();
    const loanValueNumber = rawLoanValue / 1e9 || 0;
    const loanValue = loanValueNumber.toFixed(3);
    const interest = (rawInterest / 100 || 0).toString();
    const nftPrice = (loanValue / (loanToValue / 100)).toFixed(2);
    const period = rawPeriod ? rawPeriod.toString() : '7';

    const nftMetadataByMint = await getArweaveMetadataByMint([nftMint]);
    const metadata = nftMetadataByMint[nftMint];

    const nftImageUrl = metadata?.image || '';
    const nftName = metadata?.name || '';
    const nftCollectionName = metadata?.collection?.name || '';

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
    });

    if (!nftImageUrl || !nftName) {
      console.log('This nft has broken metadata');
      return res.send('This nft has broken metadata');
    }

    const cardFilePath = generateCardFilePath(nftMint);

    await generateCardFile(nftMint, {
      nftName,
      nftImageUrl,
      period,
      loanToValue,
      loanValue,
      interest,
      nftPrice,
    });

    await postTweet({
      fullPathToCardImage: cardFilePath,
      nftName,
      nftCollectionName,
      period,
      loanToValue,
      loanValue,
    });
    await postOnDiscord(cardFilePath);

    removeCardFile(nftMint, processedLoans, 10 * 60 * 1000);

    res.send('Success');
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send('Oh shit!');
  }
});

app.get('/liquidation-alert', async (req, res) => {
  try {
    const connection = new Connection(process.env.RPC_ENDPOINT, 'confirmed');

    let { loans } = await nftLending.getters.getAllProgramAccounts({
      programId: NFT_LENDING_PROGRAM_ID,
      connection,
    });

    const nowSeconds = new Date().getTime() / 1000;
    const unfinishedLoans = loans.filter(
      (loan) =>
        loan.loanStatus === 'activated' &&
        (loan.expiredAt - nowSeconds) / 60 / 60 < 24
    );

    const alerts = unfinishedLoans.map((loan) => {
      if (liquidationAlerts.value.includes(loan.loanPublicKey)) {
        console.log('This loan liquidation alert was already processed');
      }

      liquidationAlerts.value = [...liquidationAlerts.value, loan.loanPubkey];

      const {
        loanPubkey,
        user,
        nftMint,
        nftUserTokenAccount,
        liquidityPool,
        collectionInfo,
        startedAt,
        expiredAt,
        finishedAt,
        originalPrice,
        amountToGet,
        rewardAmount,
        feeAmount,
        royaltyAmount,
        rewardInterestRate,
        feeInterestRate,
        royaltyInterestRate,
        loanStatus,
        loanType,
      } = loan;

      console.log('Loan data: ', loan);

      // if (!nftImageUrl || !nftName) {
      //   console.log(`This nft has broken metadata`)
      //   return res.send('This nft has broken metadata')
      // }

      // const cardFilePath = generateCardFilePath(nftMint)

      // await generateCardFile(nftMint, {
      //   nftName,
      //   nftImageUrl,
      //   period,
      //   loanToValue,
      //   loanValue,
      //   interest,
      //   nftPrice,
      // })

      // await postOnDiscord(cardFilePath)
      // removeCardFile(nftMint, processedLoans, 10 * 60 * 1000)

      return user;
    });

    res.send(`Successfully sent ${alerts.length} alerts`);
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send('Oh shit!');
  }
});

app.listen(8080, function () {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`);
});
