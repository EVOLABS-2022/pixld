const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/art-marketplace/subgraph/version/latest';

export interface Collection {
  id: string;
  address: string;
  name: string;
  symbol: string;
  standard: 'ERC721C' | 'ERC1155';
  creator: {
    id: string;
    address: string;
  };
  royaltyReceiver: string;
  royaltyBps: string;
  isWhitelisted: boolean;
  isFeatured: boolean;
  deployedViaFactory: boolean;
  totalSupply: string;
  floorPrice?: string;
  volume24h: string;
  volumeTotal: string;
  createdAt: string;
  updatedAt: string;
  contractURI?: string;
  isPaused: boolean;
}

export interface Token {
  id: string;
  collection: Collection;
  tokenId: string;
  owner: {
    id: string;
    address: string;
  };
  tokenURI?: string;
  isFrozen: boolean;
  totalSupply?: string;
  maxSupply?: string;
  openEditionStart?: string;
  openEditionEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  collection: Collection;
  token: Token;
  seller: {
    id: string;
    address: string;
  };
  buyer: {
    id: string;
    address: string;
  };
  price: string;
  currency: string;
  platformFee: string;
  royaltyFee: string;
  quantity: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
}

export async function querySubgraph<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    next: { revalidate: 30 }, // Cache for 30 seconds
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Query functions
export async function getCollections(options: {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: Record<string, any>;
} = {}): Promise<Collection[]> {
  const { first = 50, skip = 0, orderBy = 'createdAt', orderDirection = 'desc', where = {} } = options;
  
  const whereClause = Object.keys(where).length > 0 ? 
    `where: { ${Object.entries(where).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')} }` : '';

  const query = `
    query GetCollections($first: Int!, $skip: Int!) {
      collections(
        first: $first
        skip: $skip
        orderBy: ${orderBy}
        orderDirection: ${orderDirection}
        ${whereClause}
      ) {
        id
        address
        name
        symbol
        standard
        creator {
          id
          address
        }
        royaltyReceiver
        royaltyBps
        isWhitelisted
        isFeatured
        deployedViaFactory
        totalSupply
        floorPrice
        volume24h
        volumeTotal
        createdAt
        updatedAt
        contractURI
        isPaused
      }
    }
  `;

  const data = await querySubgraph<{ collections: Collection[] }>(query, { first, skip });
  return data.collections;
}

export async function getCollection(address: string): Promise<Collection | null> {
  const query = `
    query GetCollection($address: Bytes!) {
      collection(id: $address) {
        id
        address
        name
        symbol
        standard
        creator {
          id
          address
        }
        royaltyReceiver
        royaltyBps
        isWhitelisted
        isFeatured
        deployedViaFactory
        totalSupply
        floorPrice
        volume24h
        volumeTotal
        createdAt
        updatedAt
        contractURI
        isPaused
      }
    }
  `;

  const data = await querySubgraph<{ collection: Collection | null }>(query, { 
    address: address.toLowerCase() 
  });
  return data.collection;
}

export async function getTokensByCollection(collectionAddress: string, options: {
  first?: number;
  skip?: number;
} = {}): Promise<Token[]> {
  const { first = 50, skip = 0 } = options;
  
  const query = `
    query GetTokensByCollection($collectionAddress: Bytes!, $first: Int!, $skip: Int!) {
      tokens(
        first: $first
        skip: $skip
        where: { collection: $collectionAddress }
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        tokenId
        owner {
          id
          address
        }
        tokenURI
        isFrozen
        totalSupply
        maxSupply
        openEditionStart
        openEditionEnd
        createdAt
        updatedAt
        collection {
          id
          name
          symbol
          standard
        }
      }
    }
  `;

  const data = await querySubgraph<{ tokens: Token[] }>(query, { 
    collectionAddress: collectionAddress.toLowerCase(),
    first,
    skip 
  });
  return data.tokens;
}

export async function getUserTokens(userAddress: string, options: {
  first?: number;
  skip?: number;
} = {}): Promise<Token[]> {
  const { first = 50, skip = 0 } = options;
  
  const query = `
    query GetUserTokens($userAddress: Bytes!, $first: Int!, $skip: Int!) {
      tokens(
        first: $first
        skip: $skip
        where: { owner: $userAddress }
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        tokenId
        tokenURI
        isFrozen
        totalSupply
        createdAt
        collection {
          id
          address
          name
          symbol
          standard
          floorPrice
        }
      }
    }
  `;

  const data = await querySubgraph<{ tokens: Token[] }>(query, { 
    userAddress: userAddress.toLowerCase(),
    first,
    skip 
  });
  return data.tokens;
}

export async function getRecentSales(options: {
  first?: number;
  skip?: number;
  collectionAddress?: string;
} = {}): Promise<Sale[]> {
  const { first = 50, skip = 0, collectionAddress } = options;
  
  const whereClause = collectionAddress ? 
    `where: { collection: "${collectionAddress.toLowerCase()}" }` : '';

  const query = `
    query GetRecentSales($first: Int!, $skip: Int!) {
      sales(
        first: $first
        skip: $skip
        ${whereClause}
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        price
        currency
        platformFee
        royaltyFee
        quantity
        txHash
        blockNumber
        timestamp
        collection {
          id
          name
          symbol
        }
        token {
          id
          tokenId
          tokenURI
        }
        seller {
          id
          address
        }
        buyer {
          id
          address
        }
      }
    }
  `;

  const data = await querySubgraph<{ sales: Sale[] }>(query, { first, skip });
  return data.sales;
}