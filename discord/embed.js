import { MessageEmbed } from "discord.js";

export const buildAlertEmbed = ({ metadata, loan }) => {
  let dueAt = new Date(loan.expiredAt * 1000)
  let nowTime = new Date()

  const dueHours = Math.floor((dueAt - nowTime) / 1000 / 60 / 60)

  return new MessageEmbed()
    .setColor("#D0342C")
    .setTitle("Liquidation Alert")
    .setURL("https://frakt.xyz/loans")
    .setAuthor({
      name: "Frakt",
      iconURL:
        "https://cdn.discordapp.com/avatars/983383827235872799/84f7c27d2ba6e32873637063e6e2ccea.png?size=2048",
      url: "https://frakt.xyz/",
    })
    .setDescription(metadata.nftName + ` will be liquidated in ${dueHours} hours if not repaid!`)
    .setThumbnail(
      "https://cdn.discordapp.com/avatars/983383827235872799/84f7c27d2ba6e32873637063e6e2ccea.png?size=2048"
    )
    .addFields(
      { name: "Loan Due By", value: dueAt.toUTCString() },
      { name: '\u200b', value: "https://frakt.xyz/loans" },
    )
    .setImage(metadata.nftImageUrl)
    .setTimestamp();
};
