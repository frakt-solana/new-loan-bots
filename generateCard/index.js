import nodeHtmlToImage from 'node-html-to-image'
import font2base64 from 'node-font2base64'
import { unlink as removeFile, readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { SHORT_TERM } from '../index.js'

export const __dirname = dirname(fileURLToPath(import.meta.url))

export const generateCardFilePath = (id) => `${__dirname}/cards/card_${id}.png`

export const removeCardFile = async (id, processedLoans, delay = 0) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, delay))

    processedLoans.value = processedLoans.value.filter((mint) => mint === id)
    await removeFile(generateCardFilePath(id))

    console.log(`card_${id}.png removed`)
  } catch (error) {
    console.error('Error removing card', error)
  }
}

export const generateLoanCardFile = async (
  id,
  { nftName, nftImageUrl, period, loanToValue, loanValue, interest, nftPrice, loansType }
) => {
  try {
    const fullPath = generateCardFilePath(id)

    await nodeHtmlToImage({
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      output: fullPath,
      html: createLoanHTML({
        nftName,
        nftImageUrl,
        period,
        loanToValue,
        loanValue,
        interest,
        nftPrice,
        loansType,
      }),
    })

    console.log(`card_${id}.png generated`)

    return true
  } catch (error) {
    console.error('Generate image error', error)
    return false
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

const createLoanHTML = ({
  nftName,
  nftImageUrl,
  period,
  loanToValue,
  loanValue,
  interest,
  nftPrice,
  loansType
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
      color: #fff;
      font-family: "Oxanium-regular";
      font-size: 16px;
      width: 1200px;
      height: 675px;
    }

    .wrapper {
      width: 1200px;
      height: 675px;
      background-color: #191919;
      padding: 80px;
    }

    .card {
      width: 100%;
      height: 100%;
      border-radius: 30px;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .image {
      width: 515px;
      height: 515px;
      margin-right: 30px;
      background-image: url('${nftImageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 30px;
    }

    .info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      height: 100%;
    }

    .frakt-logo {
      height: 30px;
      margin-top: 10px;
      margin-bottom: 30px;
    }

    .title {
      font-family: Oxanium-extra-bold;
      text-transform: uppercase;
      font-size: 92px;
      color: #5d5fef;
      line-height: 80%;
      margin-bottom: 30px;
    }

    .data-row {
      color: white;
      font-size: 40px;
      margin-bottom: 20px;
      line-height: 80%;
    }

    .data-title {
      font-family: "Oxanium-extra-bold";
      text-transform: capitalize;
    }

    .name-wrapper {
      margin-top: ${loansType === SHORT_TERM ? '0' : '45px'};
      flex: 1;
      width: 100%;
      border-top: 1px solid #5d5fef;
      background: linear-gradient(90deg,
          rgba(93, 95, 239, 0.6) 0%,
          rgba(93, 95, 239, 0) 100%);
      padding: 20px;
      border-radius: 0 0 0 30px;
    }

    .name-title {
      font-family: "Oxanium-extra-bold";
      text-transform: uppercase;
      font-size: 36px;
      line-height: 45px;
    }

    .name {
      font-family: "Oxanium-medium";
      font-size: 26px;
      line-height: 32px;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="card">
      <div class="image"></div>
      <div class="info">
        <img src="data:image/svg+xml;base64, ${logoImage}" class="frakt-logo" />
        <h1 class="title">New loan</h1>
        <div class="data">
        ${loansType === SHORT_TERM ? (
          `<p class="data-row">
            <span class="data-title">Period: </span>${period} days
          </p>`
        ) : ''}
          <p class="data-row">
            <span class="data-title">Loan To Value: </span>${loanToValue}%
          </p>
          <p class="data-row">
            <span class="data-title">Loan Value: </span>${loanValue} SOL
          </p>
          <p class="data-row">
            <span class="data-title">${
              loansType === SHORT_TERM ? 'Fee:' : 'Interest:'
            } </span>${interest}%
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
`;

const createRaffleHTML = ({
  nftName,
  nftImageUrl,
  buyoutPrice,
  floorPrice
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
            color: #fff;
            font-family: "Oxanium-regular";
            font-size: 16px;
            width: 1200px;
            height: 675px;
        }

        .wrapper {
            width: 1200px;
            height: 675px;
            background-color: #5D5FEF;
            color: white;
        }

        .card {
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            align-items: center;
        }

        .image {
            width: 675px;
            height: 675px;
            background-image: url('${nftImageUrl}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        .info {
            flex: 1 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .frakt-logo {
            height: 30px;
            margin-bottom: 30px;
        }

        .title {
            font-family: "Oxanium-extra-bold";
            text-transform: uppercase;
            text-align: center;
            font-size: 92px;
            line-height: 80%;
            margin-bottom: 30px;
        }
        
        .name {
            font-family: "Oxanium-extra-bold";
            text-transform: capitalize;
            font-size: 36px;
            line-height: 45px;
            margin-bottom: 30px;        
        }

        .text {
            font-family: "Oxanium-medium";
            font-size: 44px;
            line-height: 55px;
            text-transform: capitalize;
        }

        .bold {
            font-family: "Oxanium-extra-bold";
            text-transform: uppercase;
        }

        .flex {
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
        }


    </style>
</head>

<body>
<div class="wrapper">
    <div class="card">
        <div class="image"></div>
        <div class="info">
            <img src="data:image/svg+xml;base64, ${logoImage}" class="frakt-logo" />
            <h1 class="title">New raffle</h1>
            <p class="name">${nftName}</p>
            <p class="text flex">Buyout price: <span class="bold">${buyoutPrice} SOL</span></p>
            <p class="text flex">Floor price: <span class="bold">${floorPrice} SOL</span></p>
        </div>
    </div>
</div>
</body>
</html>
`;

export const generateRaffleCardFile = async (
  id,
  { nftName, nftImageUrl, buyoutPrice, floorPrice }
) => {
  try {
    const fullPath = generateCardFilePath(id);

    await nodeHtmlToImage({
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      output: fullPath,
      html: createRaffleHTML({
        nftName,
        nftImageUrl,
        buyoutPrice,
        floorPrice
      }),
    });

    console.log(`card_${id}.png generated`);

    return true;
  } catch (error) {
    console.error('Generate image error', error);
    return false;
  }
}
