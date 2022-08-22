import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ],
});

export const initDiscord = async () => {
  client.on('ready', async () => {
    console.log(`Discord logged in as ${client.user?.tag}`);
  });

  await client.login(process.env.DISCORD_TOKEN);

  return client;
}

export const createPostOnDiscordChannel = async (channelId, fullPathToCardImage) => {
  try {
    const channel = await client.channels.fetch(channelId);

    await channel.send({
      files: [
        {
          attachment: fullPathToCardImage,
          name: 'image.png',
        },
      ],
    });

    console.log('Posted on Discord successfully');
  } catch (error) {
    console.error('Post on discord channel failed: ', error);
  }
}
