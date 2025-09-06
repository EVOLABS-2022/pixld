import { NextRequest, NextResponse } from 'next/server';
import { subgraphClient } from '@/lib/graphql';
import { gql } from 'graphql-request';

const GET_TOKENS_QUERY = gql`
  query GetTokens(
    $collection: String!,
    $first: Int!,
    $skip: Int!,
    $orderBy: Token_orderBy,
    $orderDirection: OrderDirection,
    $where: Token_filter
  ) {
    tokens(
      where: $where,
      first: $first,
      skip: $skip,
      orderBy: $orderBy,
      orderDirection: $orderDirection
    ) {
      id
      tokenId
      name
      description
      imageUrl
      collection {
        id
        address
        name
        symbol
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
      createdAt
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const address = params.address.toLowerCase();
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Parse filters
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const availability = searchParams.get('availability'); // 'listed' | 'unlisted'
    
    // Parse sorting
    const orderBy = searchParams.get('orderBy') || 'tokenId';
    const orderDirection = searchParams.get('orderDirection') || 'asc';

    // Build where clause
    const where: any = {
      collection: address,
    };

    // Add price filters
    if (minPrice || maxPrice) {
      where.listing_ = {};
      if (minPrice) {
        where.listing_.price_gte = (parseFloat(minPrice) * 1e18).toString();
      }
      if (maxPrice) {
        where.listing_.price_lte = (parseFloat(maxPrice) * 1e18).toString();
      }
    }

    // Add availability filter
    if (availability === 'listed') {
      where.listing_ = { ...where.listing_, price_gt: '0' };
    } else if (availability === 'unlisted') {
      where.listing = null;
    }

    const data = await subgraphClient.request(GET_TOKENS_QUERY, {
      collection: address,
      first: limit + 1, // Fetch one extra to check if there are more
      skip,
      orderBy: orderBy as any,
      orderDirection: orderDirection.toUpperCase() as any,
      where,
    });

    const tokens = data.tokens || [];
    const hasMore = tokens.length > limit;
    const tokensToReturn = hasMore ? tokens.slice(0, limit) : tokens;

    // Format tokens
    const formattedTokens = tokensToReturn.map((token: any) => ({
      id: token.id,
      tokenId: token.tokenId,
      name: token.name,
      description: token.description,
      imageUrl: token.imageUrl,
      collection: {
        id: token.collection.id,
        address: token.collection.address,
        name: token.collection.name,
        symbol: token.collection.symbol,
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
      createdAt: parseInt(token.createdAt),
    }));

    return NextResponse.json({
      tokens: formattedTokens,
      pagination: {
        page,
        limit,
        hasMore,
        total: tokens.length >= limit ? undefined : skip + tokens.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
