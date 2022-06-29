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
  // 24 Hours before due date
  firstAlert: [],
  // 12 Hours before due date
  finalAlert: [],
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

    // Filter out loans that are not active or are pricebased.
    const unfinishedLoans = loanData.filter(
      (loan) =>
        loan.loanStatus === "activated" && loan.loanType !== "priceBased"
    );

    // Find all loans that are due in the next 24 hours and haven't been alerted yet.
    const alertableLoans = unfinishedLoans.filter(
      (loan) =>
        (loan.expiredAt - nowSeconds) / 60 / 60 < 24 &&
        !liquidationAlerts.firstAlert.includes(loan.loanPubkey)
    );

    // Find all loans that are due in the next 12 hours and haven't been alerted yet a second time.
    const finalAlertableLoans = unfinishedLoans.filter(
      (loan) =>
        (loan.expiredAt - nowSeconds) / 60 / 60 < 12 &&
        !liquidationAlerts.finalAlert.includes(loan.loanPubkey)
    );

    const nftMints = unfinishedLoans.map((loan) => loan.nftMint);
    const nftMetadataByMint = await getArweaveMetadataByMint(nftMints);

    let errors = [];

    // Send alerts for loans that are due in the next 24 hours.
    const firstAlerts = alertableLoans.map(async (loan) => {
      liquidationAlerts.firstAlert = [
        ...liquidationAlerts.firstAlert,
        loan.loanPubkey,
      ];

      let metadata = nftMetadataByMint[loan.nftMint];

      if (!metadata) {
        errors = [loan.nftMint, ...errors];

        return;
      }

      sendLoanAlert(loan, metadata);
    });

    // Send alerts for loans that are due in the next 12 hours.
    const finalAlerts = finalAlertableLoans.map(async (loan) => {
      liquidationAlerts.finalAlert = [
        ...liquidationAlerts.finalAlert,
        loan.loanPubkey,
      ];

      let metadata = nftMetadataByMint[loan.nftMint];

      if (!metadata) {
        errors = [loan.nftMint, ...errors];

        return;
      }

      sendLoanAlert(loan, metadata);
    });

    res.send(
      `Sent ${firstAlerts.length} first alerts, ${finalAlerts.length} final alerts, and ${errors.length} errors.`
    );
  } catch (error) {
    console.error(error);
    res.statusCode = 503;
    res.send("Oh shit!");
  }
});

const sendLoanAlert = async (loan, metadata) => {
  const { user } = loan;

  let userDiscordId = await getDiscordId(
    "BS61tv1KbsPhns3ppU8pmWozfReZjhxFL2MPhBdDWNEm"
  );

  if (!userDiscordId) {
    console.log(`No associated discord id for user ${user}`);
  }

  const embed = buildAlertEmbed({
    metadata,
    loan,
  });

  await sendUserMessage(userDiscordId, embed);
};

app.listen(8080, function () {
  console.log(`Server is listening on port ${process.env.PORT || 8080}`);
});
