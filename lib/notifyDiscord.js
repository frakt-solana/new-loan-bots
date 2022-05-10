import { MessageEmbed } from 'discord.js';

export const notifyDiscord = async (client, channel) => {
  if (!client.isReady()) {
    return;
  }

  const embedMsg = new MessageEmbed({
    title: `${new Date().toLocaleString()} GMT | Stats`,
  });

  channel.send({
    embeds: [embedMsg],
    files: [
      {
        attachment: 'image.png',
        name: 'image.png',
      },
    ],
  });

  const logMsg = `Notified discord #${channel.name}: stats`;
  console.log(logMsg);
};
