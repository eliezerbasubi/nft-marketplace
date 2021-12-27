/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Image from "next/image";
import Web3Modal from "web3modal";
import { create as ipfsHttpClient } from "ipfs-http-client";

import { nftAddress, nftMarketAddress } from "../../config";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const CreateNftItem = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });

  const [buttonState, setButtonState] = useState("Create Digital Asset");

  const IPFS_URL = "https://ipfs.infura.io/ipfs";

  const router = useRouter();

  const onUploadFile = async ({ target }) => {
    const file = target.files[0];
    try {
      const uploadedFile = await client.add(file, {
        progress: (prog) => console.log("RECEIVED", prog),
      });
      setFileUrl(`${IPFS_URL}/${uploadedFile.path}`);
    } catch (err) {
      console.log("FILE ERROR", err);
    }
  };

  const onChange = ({ target }) => {
    const { name, value } = target;
    setFormInput((form) => ({ ...form, [name]: value }));
  };

  const createSale = async (url) => {
    const web3Modal = new Web3Modal();

    setButtonState("Connecting to wallet...");

    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    setButtonState("Creating token...");

    let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
    let transaction = await contract.createToken(url);
    const txn = await transaction.wait();

    console.log(txn);

    // const event = txn.events[0];

    // const value = event.args[2];
    const tokenId = txn.effectiveGasPrice.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, "ether");

    setButtonState("Getting listing price...");

    contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    const listingPrice = await contract.getListingPrice();

    setButtonState("Creating digital asset...");

    transaction = await contract.createMarketItem(nftAddress, tokenId, price, {
      value: listingPrice,
    });

    router.push("/");
  };

  const createItem = async () => {
    const { name, price, description } = formInput;
    console.log({ name, price, description, fileUrl });
    if (!name || !price || !description || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const uploaded = await client.add(data);
      const url = `${IPFS_URL}/${uploaded.path}`;

      createSale(url);
    } catch (error) {
      console.log("UPLOAD EERROR", error);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          type="text"
          placeholder="Asset name"
          name="name"
          className="mt-8 border rounded p-4"
          onChange={onChange}
        />
        <textarea
          name="description"
          cols="30"
          rows="3"
          className="mt-2 border rounded p-4"
          placeholder="Asset Description"
          onChange={onChange}
        />
        <input
          type="text"
          name="price"
          className="mt-2 border rounded p-4"
          placeholder="Asset Price in Matic"
          onChange={onChange}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onUploadFile}
        />

        {fileUrl && (
          <img
            className="rounded mt-4"
            width={350}
            src={fileUrl}
            alt="Uploaded asset"
          />
        )}

        <button
          type="button"
          onClick={createItem}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
        >
          {buttonState}
        </button>
      </div>
    </div>
  );
};

export default CreateNftItem;
