import Twit from 'twit'
import { readFile } from 'fs/promises'
import dotenv from 'dotenv'
dotenv.config()

const twitConfig = {
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.SECRET_KEY,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
}

const client = new Twit(twitConfig)

export const postTweet = async (fullPathToCardImage) => {
  try {
    const imageData = await readFile(fullPathToCardImage, {
      encoding: 'base64',
    })

    const { data: mediaUploadData } = await client.post('media/upload', {
      media_data: imageData,
      skip_status: true,
    })
    await client.post('statuses/update', {
      status: '',
      media_ids: mediaUploadData.media_id_string,
    })

    console.log('Posted on Twitter successfully')
  } catch (error) {
    console.error('Error posting image on Twitter')
  }
}
