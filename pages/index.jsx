import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Web3Modal from "web3modal";
import Image from "next/image";

import { nftAddress, nftMarketAddress } from "../config";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadNFTs = useCallback(async () => {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      NFTMarket.abi,
      provider
    );

    const data = await marketContract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (datum) => {
        const tokenURI = await tokenContract.tokenURI(datum.tokenId);
        const { data: meta } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(datum.price, "ether");

        return {
          price,
          tokenId: datum.tokenId.toNumber(),
          seller: datum.seller,
          owner: datum.owner,
          image: meta.image,
          name: meta.name,
          description: meta.description,
        };
      })
    );

    setNfts(items);
    setHasLoaded(true);
  }, []);

  const buyNFT = async (nft) => {
    // CONNECT TO THE WALLET
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    // GET SIGNER TO EXECUTE TRANSACTION
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      nftMarketAddress,
      NFTMarket.abi,
      signer
    );

    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await contract.createMarketSale(
      nftAddress,
      nft.tokenId,
      { value: price }
    );
    await transaction.wait();

    loadNFTs();
  };

  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  if (hasLoaded && !nfts.length)
    return <h1 className="px-20 py-10 text-3xl">No items in Marketplace</h1>;

  return (
    <div className="flex justify-center">
      <div className="px-4 max-w-[1600px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, index) => (
            <div
              key={index.toFixed(2)}
              className="border shadow rounded-xl overflow-hidden"
            >
              <Image src={nft.image} alt="NFT" />
              <div className="p-4">
                <p className="h-[64px] text-2xl font-semibold">{nft.name}</p>
                <div className="h-[70px] overflow-hidden">
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} Matic
                </p>
                <button
                  type="button"
                  className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                  onClick={() => buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
