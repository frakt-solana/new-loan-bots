import { generateCardFile, removeCardFile } from './generateCard/index.js'
import { getArweaveMetadataByMint } from './arweave/index.js'
import { postTweet } from './postTweet/index.js'
import { connection, loansProgram, anchorWrappedProgram } from './constants.js'
import { MOCK_LOGS } from './mocks.js'
import { initDiscord } from './discord/index.js'

const postOnDiscord = await initDiscord()

const onProgramLogHanlder = async ({ signature, logs }) => {
  try {
    console.log('Some transaction happened')
    console.log(`Transaction signature: ${signature}`)

    const isApproveLoanByAdminLogs = !!logs?.find((log) =>
      log.includes('ApproveLoanByAdmin')
    )

    if (!isApproveLoanByAdminLogs) {
      console.log('Not ApproveLoanByAdmin transaction')
      return
    }

    console.log('ApproveLoanByAdmin transaction')

    const logWithBase64Data =
      logs?.filter((log) => log?.startsWith('Program data: '))?.[1] || null

    if (!logWithBase64Data) {
      console.log("Can't get data from logs")
      return
    }

    const base64Data = logWithBase64Data.slice(14)
    const { data } = anchorWrappedProgram.coder.events.decode(base64Data)

    const {
      nftMint,
      loanToValue: rawLoanToValue,
      loanValue: rawLoanValue,
      interest: rawInterest,
    } = data

    const loanToValue = rawLoanToValue?.toNumber() / 100 || 0
    const loanValue = rawLoanValue?.toNumber() / 1e9 || 0
    const interest = rawInterest?.toNumber() / 100 || 0
    const nftPrice = loanValue / (loanToValue / 100)

    const nftMetadataByMint = await getArweaveMetadataByMint([nftMint])
    const metadata = nftMetadataByMint[nftMint]

    const nftImageUrl = metadata?.image || ''
    const nftName = metadata?.name || ''

    console.log('Loan data: ', {
      nftMint,
      nftName,
      nftImageUrl,
      loanToValue: loanToValue.toString(),
      loanValue: loanValue.toFixed(3),
      interest: interest.toString(),
      nftPrice: nftPrice.toFixed(2),
    })

    const { cardFileName, fullPath } = await generateCardFile(signature, {
      nftName,
      nftImageUrl,
      loanToValue: loanToValue.toString(),
      loanValue: loanValue.toFixed(3),
      interest: interest.toString(),
      nftPrice: nftPrice.toFixed(2),
    })

    await postTweet(fullPath)
    await postOnDiscord(fullPath)

    await removeCardFile(signature)

    console.log(`${cardFileName} removed`)
  } catch (error) {
    console.error(error)
  }
}

const startNewLoansTransactionsListening = async () => {
  connection.onLogs(loansProgram, onProgramLogHanlder)

  console.log('Server is listening')
}

onProgramLogHanlder({ signature: Date.now()?.toString(), logs: MOCK_LOGS })

startNewLoansTransactionsListening()
