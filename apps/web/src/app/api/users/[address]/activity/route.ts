import { NextRequest, NextResponse } from 'next/server';
import { subgraphClient } from '@/lib/graphql';
import { gql } from 'graphql-request';

const GET_USER_ACTIVITY_QUERY = gql`
  query GetUserActivity($user: String!, $limit: Int!) {
    # Sales where user was buyer
    buyerSales: sales(
      where: { buyer: $user }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
    ) {
      id
      price
      currency
      currencySymbol
      token {
        id
        tokenId
        name
        imageUrl
        collection {
          name
        }
      }
      seller {
        address
        displayName
      }
      timestamp
      transactionHash
    }
    
    # Sales where user was seller
    sellerSales: sales(
      where: { seller: $user }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
    ) {
      id
      price
      currency
      currencySymbol
      token {
        id
        tokenId
        name
        imageUrl
        collection {
          name
        }
      }
      buyer {
        address
        displayName
      }
      timestamp
      transactionHash
    }
    
    # Order events (listings, etc.) where user was maker
    orderEvents: orderEvents(
      where: { maker: $user }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
    ) {
      id
      type
      price
      currency
      currencySymbol
      token {
        id
        tokenId
        name
        imageUrl
        collection {
          name
        }
      }
      timestamp
      transactionHash
    }
    
    # Transfers to user (excluding sales)
    incomingTransfers: transfers(
      where: { to: $user }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
    ) {
      id
      token {
        id
        tokenId
        name
        imageUrl
        collection {
          name
        }
      }
      from {
        address
        displayName
      }
      timestamp
      transactionHash
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    
    const data = await subgraphClient.request(GET_USER_ACTIVITY_QUERY, {
      user: address,
      limit: Math.ceil(limit / 4), // Divide between different activity types
    });

    const activity = [];

    // Add purchases (user was buyer)
    if (data.buyerSales) {
      for (const sale of data.buyerSales) {
        activity.push({
          id: `purchase-${sale.id}`,
          type: 'purchase',
          price: (parseFloat(sale.price) / 1e18).toString(),
          currency: sale.currency,
          currencySymbol: sale.currencySymbol,
          token: {
            id: sale.token.id,
            tokenId: sale.token.tokenId,
            name: sale.token.name,
            imageUrl: sale.token.imageUrl,
            collection: sale.token.collection,
          },
          from: sale.seller,
          timestamp: parseInt(sale.timestamp),
          transactionHash: sale.transactionHash,
        });
      }
    }

    // Add sales (user was seller)
    if (data.sellerSales) {
      for (const sale of data.sellerSales) {
        activity.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          price: (parseFloat(sale.price) / 1e18).toString(),
          currency: sale.currency,
          currencySymbol: sale.currencySymbol,
          token: {
            id: sale.token.id,
            tokenId: sale.token.tokenId,
            name: sale.token.name,
            imageUrl: sale.token.imageUrl,
            collection: sale.token.collection,
          },
          to: sale.buyer,
          timestamp: parseInt(sale.timestamp),
          transactionHash: sale.transactionHash,
        });
      }
    }

    // Add order events (listings, cancellations)
    if (data.orderEvents) {
      for (const event of data.orderEvents) {
        let eventType = 'listing';
        if (event.type === 'CANCEL') eventType = 'cancel';
        if (event.type === 'OFFER') eventType = 'offer';

        activity.push({
          id: `order-${event.id}`,
          type: eventType,
          price: event.price ? (parseFloat(event.price) / 1e18).toString() : undefined,
          currency: event.currency,
          currencySymbol: event.currencySymbol,
          token: {
            id: event.token.id,
            tokenId: event.token.tokenId,
            name: event.token.name,
            imageUrl: event.token.imageUrl,
            collection: event.token.collection,
          },
          timestamp: parseInt(event.timestamp),
          transactionHash: event.transactionHash,
        });
      }
    }

    // Add incoming transfers (gifts, etc. - excluding sales)
    if (data.incomingTransfers) {
      for (const transfer of data.incomingTransfers) {
        // Skip if this transfer was part of a sale
        const isSale = data.buyerSales?.some(sale => 
          sale.timestamp === transfer.timestamp &&
          sale.transactionHash === transfer.transactionHash
        );
        
        if (!isSale) {
          // Check if it's a mint (from zero address)
          const isMint = transfer.from.address === '0x0000000000000000000000000000000000000000';
          
          activity.push({
            id: `transfer-${transfer.id}`,
            type: isMint ? 'mint' : 'received',
            token: {
              id: transfer.token.id,
              tokenId: transfer.token.tokenId,
              name: transfer.token.name,
              imageUrl: transfer.token.imageUrl,
              collection: transfer.token.collection,
            },
            from: isMint ? null : transfer.from,
            timestamp: parseInt(transfer.timestamp),
            transactionHash: transfer.transactionHash,
          });
        }
      }
    }

    // Sort by timestamp descending and limit results
    activity.sort((a, b) => b.timestamp - a.timestamp);
    const limitedActivity = activity.slice(0, limit);

    return NextResponse.json({
      activity: limitedActivity,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
