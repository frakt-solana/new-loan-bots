import nodeHtmlToImage from 'node-html-to-image';
import font2base64 from 'node-font2base64';
import { unlink as removeFile, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import originalFetch from 'isomorphic-fetch';
import fetch  from 'fetch-retry';
import { SHORT_TERM } from '../index.js';

export const __dirname = dirname(fileURLToPath(import.meta.url));

const syneFontBold = await font2base64.encodeToDataUrl(__dirname + '/fonts/Syne/Syne-Bold.ttf');
const syneFontExtraBold = await font2base64.encodeToDataUrl(__dirname + '/fonts/Syne/Syne-ExtraBold.ttf');
const chakraRegular = await font2base64.encodeToDataUrl(__dirname + '/fonts/ChakraPetch/ChakraPetch-Regular.ttf');

const logoImage = await readFile(__dirname + '/images/logo.svg', { encoding: 'base64' });
const logoLightImage = await readFile(__dirname + '/images/logo_light.svg', { encoding: 'base64' });
const backImage = await readFile(__dirname + '/images/back.svg', { encoding: 'base64' });
const backLightImage = await readFile(__dirname + '/images/back_light.svg', { encoding: 'base64' });
const newImage = await readFile(__dirname + '/images/new.svg', { encoding: 'base64' });
const quoteImage = await readFile(__dirname + '/images/quote.svg', { encoding: 'base64' });
const cornerImage = await readFile(__dirname + '/images/corner.svg', { encoding: 'base64' });
const solanaImage = await readFile(__dirname + '/images/solana.svg', { encoding: 'base64' });

export const generateCardFilePath = (id) => `${__dirname}/cards/card_${id}.png`;

const getBase64FromUrl = async (url) => {
  const data = await fetch(originalFetch)(url, {
    retries: 10,
    retryDelay: 1000
  });
  const blob = await data.blob();
  const buffer = await blob.arrayBuffer();

  return 'data:' + blob.type + ';base64,' + Buffer.from(buffer).toString('base64');
};

export const removeCardFile = async (id, delay = 0) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, delay));

    await removeFile(generateCardFilePath(id));

    console.log(`card_${id}.png removed`);
  } catch (error) {
    console.error('Error removing card: ', new Date(), error);
  }
};

export const generateLoanCardFile = async (id, { nftName, nftImageUrl, period, loanToValue, loanValue, interest, nftPrice, loansType }) => {
  try {
    const fullPath = generateCardFilePath(id);

    await nodeHtmlToImage({
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      output: fullPath,
      html: await createLoanHTML({
        nftName,
        nftImageUrl,
        period,
        loanToValue,
        loanValue,
        interest,
        nftPrice,
        loansType,
      }),
    });

    console.log(`card_${id}.png generated`);

    return true;
  } catch (error) {
    console.error('Generate image error: ', new Date(), error);
    return false;
  }
}

const createLoanHTML = async ({ nftName, nftImageUrl, period, loanToValue, loanValue, interest, nftPrice, loansType }) => {
  const base64 = await getBase64FromUrl(nftImageUrl);

  return `
<html>
<head>
  <style>
    @font-face {
      font-family: "Syne-Bold";
      src: url(${syneFontBold}) format('woff2');
    }
    @font-face {
      font-family: "Syne-ExtraBold";
      src: url(${syneFontExtraBold}) format('woff2');
    }
    @font-face {
      font-family: "ChakraPetch-Regular";
      src: url(${chakraRegular}) format('woff2');
    }

    * {
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    }

    body {
      color: #F3F3F3;
      font-family: ChakraPetch-Regular;
      font-size: 16px;
      width: 1024px;
      height: 512px;
    }

    .wrapper {
      width: 1024px;
      height: 512px;
      background-color: #141415;
      background-image: url("data:image/svg+xml;base64, ${backImage}");
      background-repeat: no-repeat;
      background-size: 225px 200px;
      background-position: right 0 top 0;
    }
    
    .image {
        width: 512px;
        height: 512px;
        background-image: url('${base64}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }
    
    .card {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
    }
    
    .frakt-logo {
      position: absolute;
      width: 80px;
      height: 24px;
      left: 924px;
      top: 468px;
    }
    
    .quote-top-left {
      position: absolute;
      width: 54px;
      height: 44px;
      left: 532px;
      top: 20px;
      transform: matrix(-1, 0, 0, 1, 0, 0);
    }
    
    .quote-bottom-left {
      position: absolute;
      width: 54px;
      height: 44px;
      left: 532px;
      top: 448px;
      transform: rotate(-180deg);
    }
    
    .quote-top-right {
      position: absolute;
      width: 54px;
      height: 44px;
      left: 950px;
      top: 20px;
    }
    
    .new {
      position: absolute;
      width: 115px;
      height: 42px;
      left: 710px;
      top: 36px;
    }
    
    .info {
      width: 512px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      height: 100%;
    }

    .title {
      z-index: 1;
      width: 100%;
      font-family: Syne-ExtraBold;
      text-transform: uppercase;
      text-align: center;
      font-size: 40px;
      line-height: 80%;
      margin-top: 64px;
      margin-bottom: 20px;
    }
    
    .name {
      width: 100%;
      font-family: Syne-Bold;
      font-size: 32px;
      line-height: 38px;
      text-align: center;
      text-transform: uppercase;
    }

    .data {
        width: 512px;
        position: absolute;
        top: 242px;
        display: flex;
        flex-direction: column;
        row-gap: 30px;
    }
    
    .row {
        display: flex;
        justify-content: space-around;
    }

    .param {
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        row-gap: 16px;
    }
    
    .param-title {
        margin: 0;
        color: #636366;
        font-family: Syne-Bold;
        font-size: 18px;
        line-height: 80%;
        text-transform: uppercase;
    }
    
    .param-text {
        margin: 0;
        font-family: ChakraPetch-Regular;
        font-size: 32px;
        line-height: 80%;
        text-transform: uppercase;
    }
    
    .param-text-sol {
        position: relative;
        margin: 0;
        font-family: ChakraPetch-Regular;
        font-size: 32px;
        line-height: 80%;
        text-transform: uppercase;
    }
    
    .param-text-sol:after {
        position: absolute;
        top: -3px;
        content: url("data:image/svg+xml;base64, ${solanaImage}");
        width: 32px;
        height: 32px;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="card">
      <div class="image"></div>
      <div class="info">
        <img src="data:image/svg+xml;base64, ${logoImage}" class="frakt-logo" />
        <img src="data:image/svg+xml;base64, ${quoteImage}" class="quote-top-left" />
        <img src="data:image/svg+xml;base64, ${quoteImage}" class="quote-top-right" />
        <img src="data:image/svg+xml;base64, ${quoteImage}" class="quote-bottom-left" />
        <img src="data:image/svg+xml;base64, ${newImage}" class="new" />
        
        <h1 class="title">LOAN</h1>
        <h2 class="name">${nftName}</h2>
        <div class="data">
            <div class="row">
                ${loansType === SHORT_TERM ? (
                    `<div class="param">
                        <p class="param-title">Duration</p>
                        <p class="param-text">${period} days</p>
                    </div>`
                ) : ''}
                <div class="param">
                    <p class="param-title">Loan To Value</p>
                    <p class="param-text">${loanToValue}%</p>
                </div>
            </div>
            <div class="row">
                <div class="param">
                    <p class="param-title">Floor price</p>
                    <p class="param-text-sol">${nftPrice}</p>
                </div>
                <div class="param">
                    <p class="param-title">Borrowed</p>
                    <p class="param-text-sol">${loanValue}</p>
                </div>
            </div>
            <div class="row">
                <div class="param">
                    <p class="param-title">${loansType === SHORT_TERM ? 'Fee' : 'Interest'}</p>
                    <p class="param-text">${interest}%</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`
};

const createRaffleHTML = async ({ nftName, nftImageUrl, buyoutPrice, floorPrice }) => {
  const base64 = await getBase64FromUrl(nftImageUrl);

  return `
<html>
<head>
    <style>
    @font-face {
      font-family: "Syne-Bold";
      src: url(${syneFontBold}) format('woff2');
    }
    @font-face {
      font-family: "Syne-ExtraBold";
      src: url(${syneFontExtraBold}) format('woff2');
    }
    @font-face {
      font-family: "ChakraPetch-Regular";
      src: url(${chakraRegular}) format('woff2');
    }

    * {
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    }

    body {
      color: #000000;
      font-family: ChakraPetch-Regular;
      font-size: 16px;
      width: 1024px;
      height: 512px;
    }

    .wrapper {
      width: 1024px;
      height: 512px;
      background-color: #F2F2F7;
      background-image: url("data:image/svg+xml;base64, ${backLightImage}");
      background-repeat: no-repeat;
      background-size: 225px 200px;
      background-position: right 0 top 0;
    }
    
    .image {
        width: 512px;
        height: 512px;
        background-image: url('${base64}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }
    
    .card {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
    }
    
    .frakt-logo {
      position: absolute;
      width: 80px;
      height: 24px;
      left: 532px;
      top: 468px;
    }
    
    .quote-top-left {
      position: absolute;
      width: 103px;
      height: 76px;
      left: 532px;
      top: 20px;
    }
    
    .quote-bottom-right {
      position: absolute;
      width: 103px;
      height: 76px;
      left: 910px;
      top: 416px;
      transform: rotate(-180deg);
    }
    
    .quote-top-right {
      position: absolute;
      width: 103px;
      height: 76px;
      left: 910px;
      top: 20px;
      transform: matrix(-1, 0, 0, 1, 0, 0);
    }
    
    .new {
      position: absolute;
      width: 115px;
      height: 42px;
      left: 710px;
      top: 36px;
    }
    
    .info {
      width: 512px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      height: 100%;
    }

    .title {
      z-index: 1;
      width: 100%;
      font-family: Syne-ExtraBold;
      text-transform: uppercase;
      text-align: center;
      font-size: 40px;
      line-height: 80%;
      margin-top: 64px;
      margin-bottom: 20px;
    }
    
    .name {
      width: 100%;
      font-family: Syne-Bold;
      font-size: 32px;
      line-height: 38px;
      text-align: center;
      text-transform: uppercase;
    }

    .data {
        width: 512px;
        position: absolute;
        top: 268px;
        display: flex;
        flex-direction: column;
        row-gap: 30px;
    }
    
    .row {
        display: flex;
        justify-content: space-around;
    }

    .param {
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        row-gap: 16px;
    }
    
    .param-title {
        margin: 0;
        color: #AEAEB2;
        font-family: Syne-Bold;
        font-size: 25px;
        line-height: 80%;
        text-transform: uppercase;
    }
    
    .param-text {
        margin: 0;
        font-family: ChakraPetch-Regular;
        font-size: 42px;
        line-height: 80%;
        text-transform: uppercase;
    }
    
    .param-text-sol {
        position: relative;
        margin: 0;
        font-family: ChakraPetch-Regular;
        font-size: 42px;
        line-height: 80%;
        text-transform: uppercase;
    }
    
    .param-text-sol:after {
        position: absolute;
        top: 0;
        content: url("data:image/svg+xml;base64, ${solanaImage}");
        width: 52px;
        height: 52px;
    }
  </style>
</head>

<body>
<div class="wrapper">
    <div class="card">
      <div class="image"></div>
      <div class="info">
        <img src="data:image/svg+xml;base64, ${logoLightImage}" class="frakt-logo" />
        <img src="data:image/svg+xml;base64, ${cornerImage}" class="quote-top-left" />
        <img src="data:image/svg+xml;base64, ${cornerImage}" class="quote-top-right" />
        <img src="data:image/svg+xml;base64, ${cornerImage}" class="quote-bottom-right" />
        <img src="data:image/svg+xml;base64, ${newImage}" class="new" />
        
        <h1 class="title">Raffle</h1>
        <h2 class="name">${nftName}</h2>
        <div class="data">
            <div class="row">
                <div class="param">
                    <p class="param-title">Floor price</p>
                    <p class="param-text-sol">${floorPrice}</p>
                </div>            
            </div>
            <div class="row">
                <div class="param">
                    <p class="param-title">Buyout price</p>
                    <p class="param-text-sol">${buyoutPrice}</p>
                </div>
            </div>           
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`
};

export const generateRaffleCardFile = async (id, { nftName, nftImageUrl, buyoutPrice, floorPrice }) => {
  try {
    const fullPath = generateCardFilePath(id);

    await nodeHtmlToImage({
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      output: fullPath,
      html: await createRaffleHTML({
        nftName,
        nftImageUrl,
        buyoutPrice,
        floorPrice
      }),
    });

    console.log(`card_${id}.png generated`);

  } catch (error) {
    console.error('Generate image error: ', new Date(), error);
  }
}
