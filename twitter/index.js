import Twit from 'twit'
import { readFile } from 'fs/promises'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const twitConfig = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
}

const client = new Twit(twitConfig)

export const postTweet = async ({
  fullPathToCardImage,
  nftName,
  nftCollectionName,
  period,
  loanToValue,
  loanValue,
  loansType,
}) => {
  try {
    const imageData = await readFile(fullPathToCardImage, {
      encoding: 'base64',
    })

    const text = await generateTwitterPostText({
      nftName,
      nftCollectionName,
      period,
      loanToValue,
      loanValue,
      loansType,
    })

    const { data: mediaUploadData } = await client.post('media/upload', {
      media_data: imageData,
      skip_status: true,
    })
    await client.post('statuses/update', {
      status: text,
      media_ids: mediaUploadData.media_id_string,
    })

    console.log('Posted on Twitter successfully')
  } catch (error) {
    console.error('Error posting image on Twitter')
  }
}

const MESSAGE_TEMPLATES_JSON_URL =
  'https://raw.githubusercontent.com/frakt-solana/new-loan-bots/master/message-templates.json'

const generateTwitterPostText = async ({
  nftName,
  nftCollectionName,
  period,
  loanToValue,
  loanValue,
  loansType,
}) => {
  try {
    const allMessageTemplates = await (
      await fetch(MESSAGE_TEMPLATES_JSON_URL)
    ).json()

    // const allTwitterTags = 

    // const tag = twitterTags.filter(
    //   ({ collectionName }) => collectionName === 'Pawnshop Gnomies'
    // )[0].tag

    let message = ''

    const messageByCollectionName =
      allMessageTemplates[nftCollectionName][loansType]

    if (messageByCollectionName) {
      message = getRandomMessage(messageByCollectionName)
    } else {
      const messageTemplate = allMessageTemplates['defaultMessages']
      message = geRandomMessage(messageTemplate)
    }
    
    return message
      .replace('{nftName}', nftName)
      .replace('{nftCollectionName}', nftCollectionName)
      .replace('{period}', period)
      .replace('{loanToValue}', loanToValue)
      .replace('{loanValue}', loanValue)
      // .replace('{tag}', tag)
  } catch (error) {
    console.error('Error generating twitter text', error)
    return ''
  }
}
