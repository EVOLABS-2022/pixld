import { NextRequest, NextResponse } from 'next/server';
import { subgraphClient } from '@/lib/graphql';
import { gql } from 'graphql-request';

const GET_TOKEN_QUERY = gql`
  query GetToken($id: ID!) {
    token(id: $id) {
      id
      tokenId
      name
      description
      imageUrl
      properties
      collection {
        id
        address
        name
        symbol
        standard
        royaltyBps
        verified
      }
      owner {
        id
        address
        displayName
      }
      listing {
        id
        price
        currency
        currencySymbol
        maker
        start
        end
      }
      lastSale {
        price
        timestamp
        currency
      }
      viewsCount
      favoritesCount
      createdAt
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string; tokenId: string } }
) {
  try {
    const address = params.address.toLowerCase();
    const tokenId = params.tokenId;
    const id = `${address}-${tokenId}`;
    
    const data = await subgraphClient.request(GET_TOKEN_QUERY, { id });

    if (!data.token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    const token = data.token;

    // Format the response
    const formattedToken = {
      id: token.id,
      tokenId: token.tokenId,
      name: token.name,
      description: token.description,
      imageUrl: token.imageUrl,
      properties: token.properties ? JSON.parse(token.properties) : null,
      collection: {
        id: token.collection.id,
        address: token.collection.address,
        name: token.collection.name,
        symbol: token.collection.symbol,
        standard: token.collection.standard,
        royaltyBps: parseInt(token.collection.royaltyBps || '0'),
        verified: token.collection.verified || false,
      },
      owner: {
        id: token.owner.id,
        address: token.owner.address,
        displayName: token.owner.displayName,
      },
      listing: token.listing ? {
        id: token.listing.id,
        price: (parseFloat(token.listing.price) / 1e18).toString(),
        currency: token.listing.currency,
        currencySymbol: token.listing.currencySymbol,
        maker: token.listing.maker,
        start: token.listing.start ? parseInt(token.listing.start) : null,
        end: token.listing.end ? parseInt(token.listing.end) : null,
      } : null,
      lastSale: token.lastSale ? {
        price: (parseFloat(token.lastSale.price) / 1e18).toString(),
        timestamp: parseInt(token.lastSale.timestamp),
        currency: token.lastSale.currency,
      } : null,
      viewsCount: parseInt(token.viewsCount || '0'),
      favoritesCount: parseInt(token.favoritesCount || '0'),
      createdAt: parseInt(token.createdAt),
    };

    return NextResponse.json(formattedToken);
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
