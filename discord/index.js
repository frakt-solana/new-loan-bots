import { Client, Intents } from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()

export const initDiscord = () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  })

  return new Promise((resolve, reject) => {
    client.on('ready', () => {
      console.log(`Discord logged in as ${client.user?.tag}`)
      client.channels
        .fetch(process.env.DISCORD_CHANNEL_ID)
        .then((channel) => {
          resolve(createPostOnDiscordFunction({ channel, client }))
        })
        .catch((error) => {
          console.error('Discord login error, ', error)
          reject(error)
        })
    })

    client.login(process.env.DISCORD_TOKEN)
  })
}

const createPostOnDiscordFunction =
  ({ client, channel }) =>
  async (fullPathToCardImage) => {
    try {
      if (!client.isReady()) {
        return
      }

      await channel.send({
        files: [
          {
            attachment: fullPathToCardImage,
            name: 'image.png',
          },
        ],
      })

      console.log('Posted on Discord successfully')
    } catch (error) {
      console.error('Post on discord channel failed ', error)
    }
  }
