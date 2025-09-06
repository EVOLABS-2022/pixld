import { Address } from 'viem';
import { walletManager, publicClient } from './wallet';
import {
  CONTRACT_ADDRESSES,
  COLLECTION_FACTORY_ABI,
  ERC721C_ABI,
  CollectionDeployParams,
} from './contracts';

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  external_url?: string;
}

export class CollectionService {
  private static instance: CollectionService;

  static getInstance(): CollectionService {
    if (!CollectionService.instance) {
      CollectionService.instance = new CollectionService();
    }
    return CollectionService.instance;
  }

  // Deploy a new ERC721C collection
  async deployERC721CCollection(params: {
    name: string;
    symbol: string;
    royaltyBps: number;
    contractURI: string;
  }): Promise<{ txHash: string; collectionAddress: Address }> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    // Deploy the collection
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.COLLECTION_FACTORY,
      abi: COLLECTION_FACTORY_ABI,
      functionName: 'deployERC721CCollection',
      args: [
        params.name,
        params.symbol,
        state.address as Address, // admin
        state.address as Address, // royalty receiver
        params.royaltyBps,
        CONTRACT_ADDRESSES.OPERATOR_ALLOWLIST,
        params.contractURI,
      ],
    });

    // Wait for confirmation and get the deployed address
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Collection deployment failed');
    }

    // Parse the CollectionDeployed event to get the address
    let collectionAddress: Address | undefined;
    
    for (const log of receipt.logs) {
      try {
        const decoded = publicClient.decodeEventLog({
          abi: COLLECTION_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        
        if (decoded.eventName === 'CollectionDeployed') {
          collectionAddress = decoded.args.collection as Address;
          break;
        }
      } catch (error) {
        // Skip non-matching logs
        continue;
      }
    }

    if (!collectionAddress) {
      throw new Error('Failed to get deployed collection address');
    }

    return { txHash: hash, collectionAddress };
  }

  // Deploy a new ERC1155 collection
  async deployERC1155Collection(params: {
    name: string;
    symbol: string;
    royaltyBps: number;
    contractURI: string;
  }): Promise<{ txHash: string; collectionAddress: Address }> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.COLLECTION_FACTORY,
      abi: COLLECTION_FACTORY_ABI,
      functionName: 'deployERC1155Collection',
      args: [
        params.name,
        params.symbol,
        state.address as Address,
        state.address as Address,
        params.royaltyBps,
        CONTRACT_ADDRESSES.OPERATOR_ALLOWLIST,
        params.contractURI,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Collection deployment failed');
    }

    // Parse event logs to get the collection address
    let collectionAddress: Address | undefined;
    
    for (const log of receipt.logs) {
      try {
        const decoded = publicClient.decodeEventLog({
          abi: COLLECTION_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        
        if (decoded.eventName === 'CollectionDeployed') {
          collectionAddress = decoded.args.collection as Address;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!collectionAddress) {
      throw new Error('Failed to get deployed collection address');
    }

    return { txHash: hash, collectionAddress };
  }

  // Mint a single NFT to an address
  async mintNFT(params: {
    collection: Address;
    to: Address;
    tokenURI: string;
  }): Promise<{ txHash: string; tokenId: bigint }> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: params.collection,
      abi: ERC721C_ABI,
      functionName: 'mintTo',
      args: [params.to, params.tokenURI],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Minting failed');
    }

    // Parse Transfer event to get token ID
    let tokenId: bigint | undefined;
    
    for (const log of receipt.logs) {
      try {
        const decoded = publicClient.decodeEventLog({
          abi: ERC721C_ABI,
          data: log.data,
          topics: log.topics,
        });
        
        if (decoded.eventName === 'Transfer' && decoded.args.from === '0x0000000000000000000000000000000000000000') {
          tokenId = decoded.args.tokenId;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (tokenId === undefined) {
      throw new Error('Failed to get minted token ID');
    }

    return { txHash: hash, tokenId };
  }

  // Batch mint NFTs
  async batchMintNFTs(params: {
    collection: Address;
    to: Address;
    tokenURIs: string[];
  }): Promise<{ txHash: string; startTokenId: bigint; count: number }> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: params.collection,
      abi: ERC721C_ABI,
      functionName: 'batchMintTo',
      args: [params.to, params.tokenURIs],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Batch minting failed');
    }

    // Get the first token ID from Transfer events
    const transferEvents = [];
    
    for (const log of receipt.logs) {
      try {
        const decoded = publicClient.decodeEventLog({
          abi: ERC721C_ABI,
          data: log.data,
          topics: log.topics,
        });
        
        if (decoded.eventName === 'Transfer' && decoded.args.from === '0x0000000000000000000000000000000000000000') {
          transferEvents.push(decoded.args.tokenId);
        }
      } catch (error) {
        continue;
      }
    }

    if (transferEvents.length === 0) {
      throw new Error('Failed to get minted token IDs');
    }

    // Sort to get the first token ID
    transferEvents.sort((a, b) => Number(a) - Number(b));
    
    return { 
      txHash: hash, 
      startTokenId: transferEvents[0], 
      count: transferEvents.length 
    };
  }

  // Upload metadata to IPFS
  async uploadToIPFS(data: NFTMetadata | object): Promise<string> {
    // In a real implementation, this would upload to IPFS via web3.storage or Pinata
    // For now, we'll return a placeholder IPFS hash
    
    try {
      // Placeholder: In reality you'd use a service like web3.storage
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to upload to IPFS');
      }

      const result = await response.json();
      return result.ipfsHash; // Returns something like "QmXxxxxx"
    } catch (error) {
      console.error('IPFS upload failed:', error);
      // Fallback to a mock IPFS hash for development
      const mockHash = `Qm${Math.random().toString(36).substring(2, 48)}`;
      return mockHash;
    }
  }

  // Upload file to IPFS
  async uploadFileToIPFS(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ipfs/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to IPFS');
      }

      const result = await response.json();
      return result.ipfsHash;
    } catch (error) {
      console.error('File upload failed:', error);
      // Fallback to a mock IPFS hash
      const mockHash = `Qm${Math.random().toString(36).substring(2, 48)}`;
      return mockHash;
    }
  }

  // Get collection info
  async getCollectionInfo(collection: Address): Promise<{
    name: string;
    symbol: string;
    totalSupply: bigint;
    owner: Address;
  }> {
    const [name, symbol, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: collection,
        abi: ERC721C_ABI,
        functionName: 'name',
      }) as Promise<string>,
      publicClient.readContract({
        address: collection,
        abi: ERC721C_ABI,
        functionName: 'symbol',
      }) as Promise<string>,
      publicClient.readContract({
        address: collection,
        abi: ERC721C_ABI,
        functionName: 'totalSupply',
      }) as Promise<bigint>,
    ]);

    // For now, we'll use the current user as owner (in reality, you'd read from the contract)
    const state = walletManager.getState();
    
    return {
      name,
      symbol,
      totalSupply,
      owner: state.address as Address || '0x0000000000000000000000000000000000000000',
    };
  }

  // Get NFT info
  async getNFTInfo(collection: Address, tokenId: bigint): Promise<{
    owner: Address;
    tokenURI: string;
    metadata?: NFTMetadata;
  }> {
    const [owner, tokenURI] = await Promise.all([
      publicClient.readContract({
        address: collection,
        abi: ERC721C_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      }) as Promise<Address>,
      publicClient.readContract({
        address: collection,
        abi: ERC721C_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }) as Promise<string>,
    ]);

    // Fetch metadata if tokenURI is an IPFS or HTTP URL
    let metadata: NFTMetadata | undefined;
    try {
      if (tokenURI.startsWith('http')) {
        const response = await fetch(tokenURI);
        metadata = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }

    return { owner, tokenURI, metadata };
  }

  // Estimate gas for operations
  async estimateGas(
    type: 'deployCollection' | 'mint' | 'batchMint',
    params: any
  ): Promise<{ gasEstimate: bigint; gasCost: string }> {
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    let gasEstimate: bigint;

    switch (type) {
      case 'deployCollection':
        gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACT_ADDRESSES.COLLECTION_FACTORY,
          abi: COLLECTION_FACTORY_ABI,
          functionName: 'deployERC721CCollection',
          args: [
            params.name,
            params.symbol,
            state.address as Address,
            state.address as Address,
            params.royaltyBps,
            CONTRACT_ADDRESSES.OPERATOR_ALLOWLIST,
            params.contractURI,
          ],
          account: state.address as Address,
        });
        break;

      case 'mint':
        gasEstimate = await publicClient.estimateContractGas({
          address: params.collection,
          abi: ERC721C_ABI,
          functionName: 'mintTo',
          args: [params.to, params.tokenURI],
          account: state.address as Address,
        });
        break;

      default:
        throw new Error(`Unsupported gas estimation type: ${type}`);
    }

    const gasPrice = await publicClient.getGasPrice();
    const gasCostWei = gasEstimate * gasPrice;
    const gasCost = (Number(gasCostWei) / 1e18).toFixed(4);

    return { gasEstimate, gasCost };
  }
}

// Export singleton instance
export const collectionService = CollectionService.getInstance();

// Utility functions
export const formatTokenURI = (ipfsHash: string): string => {
  return `ipfs://${ipfsHash}`;
};

export const resolveIPFS = (uri: string): string => {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return uri;
};