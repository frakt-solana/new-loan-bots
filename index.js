import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import dotenv from "dotenv";
import {
  generateCardFile,
  removeCardFile,
  generateCardFilePath,
} from "./generateCard/index.js";
import { getArweaveMetadataByMint } from "./arweave/index.js";
// import { postTweet } from './twitter/index.js'
import {
  getDiscordId,
  sendDiscordMessage,
  initDiscord,
  createPostOnDiscordFunction
} from "./discord/index.js";
// import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { loans, web3 } from "@frakt-protocol/frakt-sdk";

// const postOnDiscord = await initDiscord()
 await initDiscord();

dotenv.config();

const NFT_LENDING_PROGRAM_ID = new web3.PublicKey(
  "A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ"
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

app.post("/new-loan", async (req, res) => {
  try {
    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
      period: rawPeriod,
    } = req.body;

    if (processedLoans.value.includes(nftMint)) {
      console.log("This loan was already processed in last 10 min");
      return res.send("This loan was already processed in last 10 min");
    }

    processedLoans.value = [...processedLoans.value, nftMint];

    const loanToValueNumber = rawLoanToValue / 100 || 0;
    const loanToValue = loanToValueNumber.toString();
    const loanValueNumber = rawLoanValue / 1e9 || 0;
    const loanValue = loanValueNumber.toFixed(3);
    const interest = (rawInterest / 100 || 0).toString();
    const nftPrice = (loanValue / (loanToValue / 100)).toFixed(2);
    const period = rawPeriod ? rawPeriod.toString() : "7";

    const nftMetadataByMint = await getArweaveMetadataByMint([nftMint]);
    const metadata = nftMetadataByMint[nftMint];

    const nftImageUrl = metadata?.image || "";
    const nftName = metadata?.name || "";
    const nftCollectionName = metadata?.collection?.name || "";

    console.log("Loan data: ", {
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
      console.log("This nft has broken metadata");
      return res.send("This nft has broken metadata");
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

    // await postTweet({
    //   fullPathToCardImage: cardFilePath,
    //   nftName,
    //   nftCollectionName,
    //   period,
    //   loanToValue,
    //   loanValue,
    // })
    // await postOnDiscord(cardFilePath)

    removeCardFile(nftMint, processedLoans, 10 * 60 * 1000);

    res.send("Success");
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send("Oh shit!");
  }
});

const FRAKT_POOL_PROGRAM_ID = "6cuqS7YmKLGK5waU3KJU6xLF7KCh6KJLRs6icpYJfefe";

// app.get("/pool-alert", async (req, res) => {
//   const connection = new web3.Connection(process.env.RPC_ENDPOINT, "confirmed");

//   // const sig = await connection.getSignaturesForAddress(new PublicKey("6cuqS7YmKLGK5waU3KJU6xLF7KCh6KJLRs6icpYJfefe"))
//   // Purchase - 5XzuUGKVBAHeodt9nHphkPd3cDkEcLacVyDSXSBTkb58vv9zBv3fodQygqHuyMwVovev743iDzQ7p83YKBzrAXFA
//   // Deposit - 4MpHyGGeoxWy2NgVS7fFZ5SyVzy87CQ52B2WeWYWwQxDMVPWafVL69t5PQpBZZVMnFns2DNsQ6m1aT3JRTEvjREt
//   // "Get lottery ticket" - 5doYCQrQZVB7vJu1h2MFy7GP7r3YfdKVq3iX9QnUsWQeLg9XKD6ctMpP5PEdRKfWbY4y1Cqt961bwu8KKPjuVNtZ

//   const sig_res = await connection.getParsedTransaction(
//     "5doYCQrQZVB7vJu1h2MFy7GP7r3YfdKVq3iX9QnUsWQeLg9XKD6ctMpP5PEdRKfWbY4y1Cqt961bwu8KKPjuVNtZ"
//   );

//   console.log(sig_res.meta.postTokenBalances)

//   const is_purchase = sig_res.transaction.signatures.length === 1;
//   const is_deposit = sig_res.transaction.signatures.length === 3;

//   let signerPostBalance = sig_res.meta.postTokenBalances.find(
//     (ptb) => ptb.accountIndex === 1
//   );

//   const nftMetadataByMint = await getArweaveMetadataByMint([
//     "4SgWRA5fAMQSxQ2Qvjrg88y4TPvNu8ZHqbFJTRFfqoFn",
//   ]);

//   const metadata = nftMetadataByMint[signerPostBalance.mint];

//   let message = "";
//   if (is_purchase) {
//     message = `${metadata.name} was just purchased from the frakt pool!`;
//   }

//   if (is_deposit) {
//     message = `${metadata.name} was just added to the frakt pool!`;
//   }

//   res.send(`<p>${message}</p><br><img src="${metadata.image}">`);
// });

app.get("/liquidation-alert", async (req, res) => {
  createPostOnDiscordFunction()

  try {
    const connection = new web3.Connection(
      process.env.RPC_ENDPOINT,
      "confirmed"
    );

    let { loans: loanData } = await loans.getAllProgramAccounts(
      NFT_LENDING_PROGRAM_ID,
      connection
    );

    const nowSeconds = new Date().getTime() / 1000;
    const unfinishedLoans = loanData.filter(
      (loan) =>
        loan.loanStatus === "activated" &&
        (loan.expiredAt - nowSeconds) / 60 / 60 < 24
    );

    let userDiscordId = await getDiscordId(
      "BS61tv1KbsPhns3ppU8pmWozfReZjhxFL2MPhBdDWNEm"
    );

    const alerts = unfinishedLoans.map(async (loan) => {
      if (liquidationAlerts.value.includes(loan.loanPublicKey)) {
        console.log("This loan liquidation alert was already processed");
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

      if (!userDiscordId) {
        console.log(`No associated discord id for user ${user}`);
      }

      await sendDiscordMessage(
        userDiscordId,
        `Liquidation imminent for: \n ${JSON.stringify(loan)}!`
      );
    });

    res.send(`Successfully sent ${alerts.length} alerts`);
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send("Oh shit!");
  }
});

app.listen(8080, function () {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`);
});
