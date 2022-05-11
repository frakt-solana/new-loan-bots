import Twit from 'twit';
import fs from 'fs';
import dotenv from 'dotenv';
import pkg from '@project-serum/anchor';
import { notifyDiscord } from './lib/notifyDiscord.js';
import { generateImage } from './generateImage/index.js';
import web3 from '@solana/web3.js';
import { NodeWallet } from '@metaplex/js';
import { config } from './config.js';
import { getArweaveMetadataByMint } from './getArve/index.js';
import { returnAnchorProgram } from '@frakters/nft-lending-v2';

import { initClient as initDiscordClient } from './lib/index.js';

dotenv.config();

const client = new Twit(config);

const createFakeWallet = () => {
  const leakedKp = web3.Keypair.fromSecretKey(
    Uint8Array.from([
      208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75, 115, 181, 199, 242,
      120, 4, 78, 75, 19, 227, 13, 215, 184, 108, 226, 53, 111, 149, 179, 84,
      137, 121, 79, 1, 160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158,
      226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15, 249, 157, 62, 80,
    ])
  );
  return new NodeWallet(leakedKp);
};

// const LOGS = [
//   'Program 11111111111111111111111111111111 invoke [1]',
//   'Program 11111111111111111111111111111111 success',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
//   'Program log: Instruction: InitializeAccount',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3391 of 200000 compute units',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
//   'Program ESuQdAjueJSARPYsUZnB7nxbWKEPU8ynkRWLrFrGZsLi invoke [1]',
//   'Program log: Instruction: ApproveLoanByAdmin',
//   'Program data: F+RaSiR63fMsAAAARGdUU2t6Wks5ZEVobmNndFNrNGhLOFNlN1JpYTJ4WmNYTGtDaVhSTm1nQ1gC',
//   'Program data: yKU3x33VBPMsAAAARGdUU2t6Wks5ZEVobmNndFNrNGhLOFNlN1JpYTJ4WmNYTGtDaVhSTm1nQ1iAOgkAAAAAAEBIkBQAAAAAuAsAAAAAAADKAwAAAAAAACwAAABEb0IzcGVIbWdRVUc5cW52Z3dRUUd5dVZkdGZucTFlWXVaNWlSNTU4UXU3OA==',
//   'Program log: 2000040951, 2140559, 143068',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
//   'Program log: Instruction: Transfer',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2755 of 110113 compute units',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
//   'Program log: Instruction: CloseAccount',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1836 of 104128 compute units',
//   'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
//   'Program ESuQdAjueJSARPYsUZnB7nxbWKEPU8ynkRWLrFrGZsLi consumed 101766 of 200000 compute units',
//   'Program ESuQdAjueJSARPYsUZnB7nxbWKEPU8ynkRWLrFrGZsLi success',
// ];

const subsFunc = async () => {
  const connection = new web3.Connection(process.env.RPC_ENDPOINT);
  const { Provider } = pkg;
  const wallet = createFakeWallet();
  const provider = new Provider(connection, wallet, null);
  const programId = new web3.PublicKey(
    'ESuQdAjueJSARPYsUZnB7nxbWKEPU8ynkRWLrFrGZsLi'
  );
  const program = returnAnchorProgram(programId, provider);
  const discordClient = await initDiscordClient();
  const channel = await discordClient.channels.fetch(process.env.CHANNEL_ID);

  connection.onLogs(programId, async ({ logs }) => {
    const isApproveLoanByAdmin = !!logs?.find((log) =>
      log.includes('ApproveLoanByAdmin')
    );

    if (isApproveLoanByAdmin) {
      const log = logs?.filter((log) => log.startsWith('Program data: '))[1];

      if (!log) return;

      const base64Data = log.slice(14);

      const { data } = program.coder.events.decode(base64Data);

      if (data) {
        console.log(data);
        const { nftMint, loanValue, loanToValue, interest } = data;

        try {
          const metaData = await getArweaveMetadataByMint([nftMint]);
          const urlImage = Object.values(metaData)[0]?.image;
          const nftName = Object.values(metaData)[0]?.name;

          await generateImage(
            loanValue,
            loanToValue,
            interest,
            urlImage,
            nftName
          );

          postTweet(loanValue, loanToValue, interest, urlImage, nftName);
          postLoansStats(discordClient, channel);
        } catch (error) {
          console.log(error);
        }
      }
    }
  });
};

const postLoansStats = async (discordClient, channel) => {
  try {
    notifyDiscord(discordClient, channel);
  } catch (error) {
    console.log(error);
  }
};

const postTweet = async () => {
  const imageData = fs.readFileSync('./image.png', {
    encoding: 'base64',
  });

  client.post('media/upload', { media: imageData }, (error, media) => {
    if (error) {
      console.log(error);
    } else {
      const status = {
        status: 'I tweeted from Node.js!',
        media_ids: media.media_id_string,
      };

      client.post('statuses/update', status, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Successfully tweeted an image!');
        }
      });
    }
  });
};

subsFunc();
