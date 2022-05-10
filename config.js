import dotenv from 'dotenv';
dotenv.config();

export const config = {
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.SECRET_KEY,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};
