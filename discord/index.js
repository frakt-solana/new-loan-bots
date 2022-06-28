import { Client, Intents } from "discord.js";
import nodeFetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

export const initDiscord = async () => {
  client.on("ready", async () => {
    console.log(`Discord logged in as ${client.user?.tag}`);
  });

  await client.login(process.env.DISCORD_TOKEN);

  return client;
};

export const createPostOnDiscordChannel = async (fullPathToCardImage) => {
  if (!client.isReady()) {
    return;
  }

  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);

  try {
    await channel.send({
      files: [
        {
          attachment: fullPathToCardImage,
          name: "image.png",
        },
      ],
    });

    console.log("Posted on Discord successfully");
  } catch (error) {
    console.error("Post on discord channel failed ", error);
  }
};

export const sendUserMessage = async (userId, message) => {
  const user = await client.users.fetch(userId);

  return user.send({ embeds: [message] });
};

export const getDiscordId = async (publicKey) => {
  const userRes = await nodeFetch(
    `https://fraktion-monorep.herokuapp.com/user/${publicKey}`
  );
  const userData = await userRes.json();

  return userData?.discordId;
};
