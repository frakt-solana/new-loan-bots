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
  sendUserMessage,
  initDiscord,
  createPostOnDiscordChannel,
} from "./discord/index.js";
import { buildAlertEmbed } from "./discord/embed.js";

import { loans, web3 } from "@frakt-protocol/frakt-sdk";

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
    await createPostOnDiscordChannel(cardFilePath);

    removeCardFile(nftMint, processedLoans, 10 * 60 * 1000);

    res.send("Success");
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send("Oh shit!");
  }
});

app.get("/liquidation-alert", async (req, res) => {
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
        loan.loanType !== "priceBased" &&
        (loan.expiredAt - nowSeconds) / 60 / 60 < 24 &&
        !liquidationAlerts.value.includes(loan.loanPubkey)
    );

    const nftMints = unfinishedLoans.map((loan) => loan.nftMint);
    const nftMetadataByMint = await getArweaveMetadataByMint(nftMints);

    const alerts = unfinishedLoans.map(async (loan) => {
      liquidationAlerts.value = [...liquidationAlerts.value, loan.loanPubkey];

      const { user, nftMint } = loan;

      let userDiscordId = await getDiscordId(user);

      if (!userDiscordId) {
        console.log(`No associated discord id for user ${user}`);
      }

      const embed = buildAlertEmbed({
        metadata: nftMetadataByMint[nftMint],
        loan,
      });

      await sendUserMessage(userDiscordId, embed);
    });

    res.send(`Sent ${alerts.length} alerts`);
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send("Oh shit!");
  }
});

app.listen(8080, function () {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`);
});
