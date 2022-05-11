export const notifyDiscord = async (client, channel) => {
  if (!client.isReady()) {
    return;
  }

  channel.send({
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
