import { ethers, BrowserProvider, Contract } from 'ethers';
import FoodShareABI from '../constants/FoodShare.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface FoodListing {
  id: number;
  donor: string;
  title: string;
  description: string;
  quantity: number;
  expiry: number;
  location: string;
  isClaimed: boolean;
  claimedBy: string;
  claimedAt: number;
}

export const connectWallet = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  return accounts[0];
};

export const getContract = async (): Promise<Contract> => {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('Contract address not configured');
  }

  return new Contract(contractAddress, FoodShareABI.abi, signer);
};

export const listFoodOnBlockchain = async (
  title: string,
  description: string,
  quantity: number,
  expiry: number,
  location: string
): Promise<number> => {
  const contract = await getContract();
  const transaction = await contract.listFood(
    title,
    description,
    quantity,
    expiry,
    location
  );

  const receipt = await transaction.wait();
  
  // Get the listing ID from the event
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog && parsedLog.name === 'FoodListed') {
        return Number(parsedLog.args[0]); // id is the first argument
      }
    } catch (e) {
      // Continue checking other logs
      continue;
    }
  }
  
  throw new Error('FoodListed event not found');
};

export const claimFoodOnBlockchain = async (listingId: number): Promise<void> => {
  const contract = await getContract();
  const transaction = await contract.claimFood(listingId);
  await transaction.wait();
};

export const getFoodListingFromBlockchain = async (listingId: number): Promise<FoodListing> => {
  const contract = await getContract();
  const listing = await contract.getFoodListing(listingId);
  
  return {
    id: Number(listing[0]),
    donor: listing[1],
    title: listing[2],
    description: listing[3],
    quantity: Number(listing[4]),
    expiry: Number(listing[5]),
    location: listing[6],
    isClaimed: listing[7],
    claimedBy: listing[8],
    claimedAt: Number(listing[9]),
  };
};