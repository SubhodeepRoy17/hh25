import { ethers, Contract } from 'ethers';
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

export const getContract = (): Contract => {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Use Web3Provider instead of BrowserProvider (Ethers v5)
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
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
  const contract = getContract();
  const transaction = await contract.listFood(
    title,
    description,
    quantity,
    expiry,
    location
  );

  const receipt = await transaction.wait();
  
  // Get the listing ID from the event (Ethers v5 syntax)
  const event = receipt.events.find((e: any) => e.event === 'FoodListed');
  if (!event) {
    throw new Error('FoodListed event not found');
  }
  
  return event.args.id.toNumber();
};

export const claimFoodOnBlockchain = async (listingId: number): Promise<void> => {
  const contract = getContract();
  const transaction = await contract.claimFood(listingId);
  await transaction.wait();
};

export const getFoodListingFromBlockchain = async (listingId: number): Promise<FoodListing> => {
  const contract = getContract();
  const listing = await contract.getFoodListing(listingId);
  
  return {
    id: listing.id.toNumber(),
    donor: listing.donor,
    title: listing.title,
    description: listing.description,
    quantity: listing.quantity.toNumber(),
    expiry: listing.expiry.toNumber(),
    location: listing.location,
    isClaimed: listing.isClaimed,
    claimedBy: listing.claimedBy,
    claimedAt: listing.claimedAt.toNumber(),
  };
};