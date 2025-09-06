import { Address } from 'viem';

// Contract addresses - these would be deployed contract addresses on Abstract
export const CONTRACT_ADDRESSES = {
  MARKETPLACE: '0x0000000000000000000000000000000000000001' as Address,
  COLLECTION_FACTORY: '0x0000000000000000000000000000000000000002' as Address,
  ROYALTY_REGISTRY: '0x0000000000000000000000000000000000000003' as Address,
  OPERATOR_ALLOWLIST: '0x0000000000000000000000000000000000000004' as Address,
} as const;

// Marketplace ABI
export const MARKETPLACE_ABI = [
  {
    type: 'function',
    name: 'fill',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'ask',
        type: 'tuple',
        components: [
          { name: 'maker', type: 'address' },
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'quantity', type: 'uint256' },
          { name: 'currency', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'start', type: 'uint64' },
          { name: 'end', type: 'uint64' },
          { name: 'salt', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'standard', type: 'uint8' },
          { name: 'strategy', type: 'uint8' },
        ],
      },
      { name: 'sig', type: 'bytes' },
      { name: 'takerQuantity', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'fillMany',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'asks',
        type: 'tuple[]',
        components: [
          { name: 'maker', type: 'address' },
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'quantity', type: 'uint256' },
          { name: 'currency', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'start', type: 'uint64' },
          { name: 'end', type: 'uint64' },
          { name: 'salt', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'standard', type: 'uint8' },
          { name: 'strategy', type: 'uint8' },
        ],
      },
      { name: 'sigs', type: 'bytes[]' },
      { name: 'takerQuantities', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancel',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'nonce', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hashAsk',
    stateMutability: 'view',
    inputs: [
      {
        name: 'a',
        type: 'tuple',
        components: [
          { name: 'maker', type: 'address' },
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'quantity', type: 'uint256' },
          { name: 'currency', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'start', type: 'uint64' },
          { name: 'end', type: 'uint64' },
          { name: 'salt', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'standard', type: 'uint8' },
          { name: 'strategy', type: 'uint8' },
        ],
      },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'nonceUsed',
    stateMutability: 'view',
    inputs: [
      { name: 'maker', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'event',
    name: 'OrderFilled',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true },
      { name: 'collection', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'maker', type: 'address', indexed: false },
      { name: 'taker', type: 'address', indexed: false },
      { name: 'takerQuantity', type: 'uint256', indexed: false },
      { name: 'currency', type: 'address', indexed: false },
      { name: 'totalPrice', type: 'uint256', indexed: false },
      { name: 'royaltyAmount', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'OrderCancelled',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true },
      { name: 'maker', type: 'address', indexed: true },
    ],
  },
] as const;

// ERC721C Collection ABI
export const ERC721C_ABI = [
  {
    type: 'function',
    name: 'mintTo',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI_', type: 'string' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'batchMintTo',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURIs', type: 'string[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'royaltyInfo',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'salePrice', type: 'uint256' },
    ],
    outputs: [
      { name: 'receiver', type: 'address' },
      { name: 'royaltyAmount', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'approved', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'approved', type: 'bool', indexed: false },
    ],
  },
] as const;

// Collection Factory ABI
export const COLLECTION_FACTORY_ABI = [
  {
    type: 'function',
    name: 'deployERC721CCollection',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'admin_', type: 'address' },
      { name: 'royaltyReceiver_', type: 'address' },
      { name: 'royaltyBps_', type: 'uint96' },
      { name: 'operatorRegistry_', type: 'address' },
      { name: 'contractURI_', type: 'string' },
    ],
    outputs: [{ name: 'collection', type: 'address' }],
  },
  {
    type: 'function',
    name: 'deployERC1155Collection',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'admin_', type: 'address' },
      { name: 'royaltyReceiver_', type: 'address' },
      { name: 'royaltyBps_', type: 'uint96' },
      { name: 'operatorRegistry_', type: 'address' },
      { name: 'contractURI_', type: 'string' },
    ],
    outputs: [{ name: 'collection', type: 'address' }],
  },
  {
    type: 'event',
    name: 'CollectionDeployed',
    inputs: [
      { name: 'collection', type: 'address', indexed: true },
      { name: 'deployer', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'standard', type: 'string', indexed: false },
    ],
  },
] as const;

// EIP712 Domain for marketplace signatures
export const EIP712_DOMAIN = {
  name: 'ArtMarket',
  version: '1',
  chainId: 11124, // Abstract testnet
  verifyingContract: CONTRACT_ADDRESSES.MARKETPLACE,
} as const;

// EIP712 Types for Ask orders
export const ASK_TYPES = {
  Ask: [
    { name: 'maker', type: 'address' },
    { name: 'collection', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'quantity', type: 'uint256' },
    { name: 'currency', type: 'address' },
    { name: 'price', type: 'uint256' },
    { name: 'start', type: 'uint64' },
    { name: 'end', type: 'uint64' },
    { name: 'salt', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'standard', type: 'uint8' },
    { name: 'strategy', type: 'uint8' },
  ],
} as const;

// Order standards
export enum OrderStandard {
  ERC721 = 0,
  ERC1155 = 1,
}

// Order strategies
export enum OrderStrategy {
  FIXED_PRICE = 0,
  AUCTION = 1,
}

// Utility types
export interface Ask {
  maker: Address;
  collection: Address;
  tokenId: bigint;
  quantity: bigint;
  currency: Address;
  price: bigint;
  start: bigint;
  end: bigint;
  salt: bigint;
  nonce: bigint;
  standard: OrderStandard;
  strategy: OrderStrategy;
}

export interface CollectionDeployParams {
  name: string;
  symbol: string;
  royaltyBps: number;
  contractURI: string;
}