import { getArweaveMetadataByMint } from './arweave/index.js';

export const getNftMetadataByMint = async (nftMint) => {
  const nftMetadataByMint = await getArweaveMetadataByMint([nftMint]);
  const metadata = nftMetadataByMint[nftMint];

  const nftImageUrl = metadata?.image || '';
  const nftName = metadata?.name || '';
  const nftCollectionName = metadata?.collection?.name || '';

  return {
    nftImageUrl,
    nftName,
    nftCollectionName,
  };
};

export const getRandomMessage = (messagesArray) => (messagesArray?.[Math.floor(Math.random() * messagesArray.length)] || '');
