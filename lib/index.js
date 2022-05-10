import { Client, Intents } from 'discord.js'

export const initClient = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  })

  return new Promise((resolve) => {
    client.on('ready', () => {
      console.log(`Logged in as ${client.user?.tag}!`)
      resolve(client)
    })

    client.login('OTcwMzcxNjE4MTYzNTIzNTg1.Ym6-_g.0YW16NqzvPPbxX1Bqt1PJyjs7Is')
  })
}
