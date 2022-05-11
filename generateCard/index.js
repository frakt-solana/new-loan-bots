import nodeHtmlToImage from 'node-html-to-image'
import font2base64 from 'node-font2base64'
import { unlink as removeFile, readFile } from 'fs/promises'

import { fileURLToPath } from 'url'
import { dirname } from 'path'
export const __dirname = dirname(fileURLToPath(import.meta.url))

export const removeCardFile = async (signature) => {
  await removeFile(`${__dirname}/cards/card_${signature}.png`)
}

export const generateCardFile = async (
  signature,
  { nftName, nftImageUrl, loanToValue, loanValue, interest, nftPrice }
) => {
  try {
    const cardFileName = `card_${signature}.png`
    const fullPath = `${__dirname}/cards/${cardFileName}`

    await nodeHtmlToImage({
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      output: fullPath,
      html: createHTML({
        nftName,
        nftImageUrl,
        loanToValue,
        loanValue,
        interest,
        nftPrice,
      }),
    })

    console.log(`${cardFileName} generated`)

    return { cardFileName, fullPath }
  } catch (error) {
    console.error('Generate image error', error)
  }
}

const oxaniumFontBold = await font2base64.encodeToDataUrl(
  __dirname + '/fonts/Oxanium-ExtraBold.ttf'
)

const oxaniumFontRegular = await font2base64.encodeToDataUrl(
  __dirname + '/fonts/Oxanium-Regular.ttf'
)

const oxaniumFontMedium = await font2base64.encodeToDataUrl(
  __dirname + '/fonts/Oxanium-Medium.ttf'
)

const logoImage = await readFile(__dirname + '/images/logo.svg', {
  encoding: 'base64',
})

const bgImage = await readFile(__dirname + '/images/bg.png', {
  encoding: 'base64',
})

const createHTML = ({
  nftName,
  nftImageUrl,
  loanToValue,
  loanValue,
  interest,
  nftPrice,
}) => `
<html>
  <head>
    <style>
    @font-face {
      font-family: "Oxanium-extra-bold";
      src: url(${oxaniumFontBold}) format('woff2');
    }
    @font-face {
      font-family: "Oxanium-regular";
      src: url(${oxaniumFontRegular}) format('woff2');
    }
    @font-face {
      font-family: "Oxanium-medium";
      src: url(${oxaniumFontMedium}) format('woff2');
    }

    * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }

  body {
    width: 1200px;
    height: 675px;
    color: #fff;
    font-family: "Oxanium-regular";
    font-size: 16px;
  }

  .wrapper {
    width: 1200px;
    height: 675px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: no-repeat center url('data:image/png;base64, ${bgImage}');
    background-size: cover;
  }

  .card {
    width: 1000px;
    height: 475px;
    border: 1px solid #4d4d4d;
    background: #191919;
    border-radius: 30px;
    overflow: hidden;
    display: flex;
    padding: 30px;
  }

  .image {
    width: 415px;
    height: 415px;
    margin-right: 30px;
    background-image: url('${nftImageUrl}');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .frakt-logo {
    height: 30px;
    margin-bottom: 30px;
  }

  .title {
    font-family: Oxanium-extra-bold;
    text-transform: uppercase;
    font-size: 70px;
    color: #5d5fef;
    line-height: 80%;
    margin-bottom: 30px;
  }

  .data-row {
    color: white;
    font-size: 24px;
    margin-bottom: 20px;
    line-height: 80%;
  }

  .data-row:last-child {
    margin-bottom: 25px;
  }

  .data-title {
    font-size: 24px;
    color: #4d4d4d;
    font-family: "Oxanium-extra-bold";
  }

  .name-wrapper {
    width: 100%;
    height: 100px;
    border-top: 1px solid #5d5fef;
    background: linear-gradient(90deg,
        rgba(93, 95, 239, 0.6) 0%,
        rgba(93, 95, 239, 0) 100%);
    padding: 20px;
    line-height: 30px;
  }

  .name-title {
    text-transform: uppercase;
    font-size: 24px;
    font-family: "Oxanium-extra-bold";
  }

  .name {
    font-family: "Oxanium-medium";
    font-size: 24px;
  }
</style>
</head>
<body>
<div class="wrapper">
    <div class="card">
      <div class="image"></div>
      <div class="info">
        <img class="frakt-logo" src="data:image/svg+xml;base64, ${logoImage}" />
        <h1 class="title">New loan</h1>
        <div class="data">
          <p class="data-row">
            <span class="data-title">Period: </span>7 days
          </p>
          <p class="data-row">
            <span class="data-title">Loan To Value: </span>${loanToValue}%
          </p>
          <p class="data-row">
            <span class="data-title">Loan Value: </span>${loanValue} SOL
          </p>
          <p class="data-row">
            <span class="data-title">Interest: </span>${interest}%
          </p>
        </div>
        <div class="name-wrapper">
          <p class="name-title">Nft collateral</p>
          <p class="name">${nftName} | ${nftPrice} SOL</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`
