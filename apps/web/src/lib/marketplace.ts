import { Address, parseEther, formatEther } from 'viem';
import { walletManager, publicClient } from './wallet';
import {
  CONTRACT_ADDRESSES,
  MARKETPLACE_ABI,
  ERC721C_ABI,
  EIP712_DOMAIN,
  ASK_TYPES,
  Ask,
  OrderStandard,
  OrderStrategy,
} from './contracts';

export class MarketplaceService {
  private static instance: MarketplaceService;

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  // Create an ask order (listing)
  async createAsk(params: {
    collection: Address;
    tokenId: bigint;
    price: string; // In ETH
    duration?: number; // In seconds, 0 for no expiration
    currency?: Address; // Default to ETH (0x0)
    quantity?: bigint; // Default 1 for ERC721
  }): Promise<{ ask: Ask; signature: string }> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    // Generate nonce (timestamp + random)
    const nonce = BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));
    const salt = BigInt(Math.floor(Math.random() * 1000000));
    
    const ask: Ask = {
      maker: state.address as Address,
      collection: params.collection,
      tokenId: params.tokenId,
      quantity: params.quantity || 1n,
      currency: params.currency || '0x0000000000000000000000000000000000000000',
      price: parseEther(params.price),
      start: BigInt(Math.floor(Date.now() / 1000)),
      end: params.duration ? BigInt(Math.floor(Date.now() / 1000) + params.duration) : 0n,
      salt,
      nonce,
      standard: OrderStandard.ERC721, // TODO: Detect from contract
      strategy: OrderStrategy.FIXED_PRICE,
    };

    // Sign the order
    const signature = await walletManager.signTypedData(
      EIP712_DOMAIN,
      ASK_TYPES,
      ask
    );

    return { ask, signature };
  }

  // Purchase an NFT
  async fillAsk(
    ask: Ask,
    signature: string,
    takerQuantity: bigint = 1n
  ): Promise<string> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    // Calculate total price
    const totalPrice = ask.price * takerQuantity;

    // Check if we need to use native ETH or ERC20
    const isNative = ask.currency === '0x0000000000000000000000000000000000000000';

    // Execute the fill transaction
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: 'fill',
      args: [ask, signature as `0x${string}`, takerQuantity],
      value: isNative ? totalPrice : 0n,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    return hash;
  }

  // Batch purchase multiple NFTs
  async fillManyAsks(
    orders: { ask: Ask; signature: string; quantity: bigint }[]
  ): Promise<string> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    const asks = orders.map(o => o.ask);
    const signatures = orders.map(o => o.signature as `0x${string}`);
    const quantities = orders.map(o => o.quantity);

    // Calculate total native value needed
    const totalValue = orders.reduce((sum, order) => {
      const isNative = order.ask.currency === '0x0000000000000000000000000000000000000000';
      return sum + (isNative ? order.ask.price * order.quantity : 0n);
    }, 0n);

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: 'fillMany',
      args: [asks, signatures, quantities],
      value: totalValue,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    return hash;
  }

  // Cancel an order
  async cancelOrder(nonce: bigint): Promise<string> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: 'cancel',
      args: [nonce],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    return hash;
  }

  // Check if user has approved marketplace to transfer NFT
  async checkApproval(collection: Address, owner: Address): Promise<boolean> {
    const isApproved = await publicClient.readContract({
      address: collection,
      abi: ERC721C_ABI,
      functionName: 'isApprovedForAll',
      args: [owner, CONTRACT_ADDRESSES.MARKETPLACE],
    });

    return isApproved;
  }

  // Approve marketplace to transfer NFTs
  async approveMarketplace(collection: Address): Promise<string> {
    const walletClient = await walletManager.getWalletClient();
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: collection,
      abi: ERC721C_ABI,
      functionName: 'setApprovalForAll',
      args: [CONTRACT_ADDRESSES.MARKETPLACE, true],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    return hash;
  }

  // Get order hash for tracking
  async getOrderHash(ask: Ask): Promise<string> {
    const hash = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: 'hashAsk',
      args: [ask],
    });

    return hash;
  }

  // Check if nonce is used
  async isNonceUsed(maker: Address, nonce: bigint): Promise<boolean> {
    const isUsed = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: 'nonceUsed',
      args: [maker, nonce],
    });

    return isUsed;
  }

  // Estimate gas for a transaction
  async estimateGas(
    type: 'fill' | 'fillMany' | 'cancel' | 'approve',
    params: any
  ): Promise<{ gasEstimate: bigint; gasCost: string }> {
    const state = walletManager.getState();
    
    if (!state.address) {
      throw new Error('Wallet not connected');
    }

    let gasEstimate: bigint;

    switch (type) {
      case 'fill':
        const { ask, signature, quantity } = params;
        const totalPrice = ask.price * quantity;
        const isNative = ask.currency === '0x0000000000000000000000000000000000000000';
        
        gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACT_ADDRESSES.MARKETPLACE,
          abi: MARKETPLACE_ABI,
          functionName: 'fill',
          args: [ask, signature, quantity],
          value: isNative ? totalPrice : 0n,
          account: state.address as Address,
        });
        break;

      case 'approve':
        gasEstimate = await publicClient.estimateContractGas({
          address: params.collection,
          abi: ERC721C_ABI,
          functionName: 'setApprovalForAll',
          args: [CONTRACT_ADDRESSES.MARKETPLACE, true],
          account: state.address as Address,
        });
        break;

      default:
        throw new Error(`Unsupported gas estimation type: ${type}`);
    }

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();
    const gasCostWei = gasEstimate * gasPrice;
    const gasCost = formatEther(gasCostWei);

    return { gasEstimate, gasCost };
  }
}

// Export singleton instance
export const marketplaceService = MarketplaceService.getInstance();

// Utility functions
export const formatPrice = (price: bigint): string => {
  return formatEther(price);
};

export const parsePrice = (price: string): bigint => {
  return parseEther(price);
};

export const calculatePlatformFee = (price: bigint, feeBps: number = 200): bigint => {
  return (price * BigInt(feeBps)) / 10000n;
};

export const calculateRoyalty = (price: bigint, royaltyBps: number): bigint => {
  return (price * BigInt(royaltyBps)) / 10000n;
};

export const calculateTotalCost = (
  price: bigint,
  platformFeeBps: number = 200,
  royaltyBps: number = 0
): {
  price: bigint;
  platformFee: bigint;
  royalty: bigint;
  total: bigint;
} => {
  const platformFee = calculatePlatformFee(price, platformFeeBps);
  const royalty = calculateRoyalty(price, royaltyBps);
  const total = price + platformFee + royalty;

  return { price, platformFee, royalty, total };
};