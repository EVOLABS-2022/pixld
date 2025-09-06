import { NextRequest, NextResponse } from 'next/server';
import { subgraphClient } from '@/lib/graphql';
import { gql } from 'graphql-request';

const GET_ACTIVITY_QUERY = gql`
  query GetTokenActivity($tokenId: String!, $collection: String!) {
    sales(
      where: { token_: { collection: $collection, tokenId: $tokenId } }
      orderBy: timestamp
      orderDirection: desc
      first: 50
    ) {
      id
      price
      currency
      currencySymbol
      buyer {
        id
        address
        displayName
      }
      seller {
        id
        address
        displayName
      }
      timestamp
      transactionHash
    }
    
    transfers(
      where: { token_: { collection: $collection, tokenId: $tokenId } }
      orderBy: timestamp
      orderDirection: desc
      first: 50
    ) {
      id
      from {
        id
        address
        displayName
      }
      to {
        id
        address
        displayName
      }
      timestamp
      transactionHash
    }
    
    orderEvents(
      where: { token_: { collection: $collection, tokenId: $tokenId } }
      orderBy: timestamp
      orderDirection: desc
      first: 50
    ) {
      id
      type
      price
      currency
      currencySymbol
      maker {
        id
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
  { params }: { params: { address: string; tokenId: string } }
) {
  try {
    const address = params.address.toLowerCase();
    const tokenId = params.tokenId;
    
    const data = await subgraphClient.request(GET_ACTIVITY_QUERY, {
      collection: address,
      tokenId,
    });

    const activity = [];

    // Add sales
    if (data.sales) {
      for (const sale of data.sales) {
        activity.push({
          id: `sale-${sale.id}`,
          type: 'sale' as const,
          price: (parseFloat(sale.price) / 1e18).toString(),
          currency: sale.currency,
          currencySymbol: sale.currencySymbol,
          from: sale.seller,
          to: sale.buyer,
          timestamp: parseInt(sale.timestamp),
          transactionHash: sale.transactionHash,
        });
      }
    }

    // Add transfers (non-sale)
    if (data.transfers) {
      for (const transfer of data.transfers) {
        // Skip if this transfer was part of a sale (we already added it above)
        const isSale = data.sales?.some(sale => 
          sale.timestamp === transfer.timestamp &&
          sale.transactionHash === transfer.transactionHash
        );
        
        if (!isSale) {
          // Determine if this is a mint (from zero address)
          const isMint = transfer.from.address === '0x0000000000000000000000000000000000000000';
          
          activity.push({
            id: `transfer-${transfer.id}`,
            type: isMint ? ('mint' as const) : ('transfer' as const),
            from: isMint ? null : transfer.from,
            to: transfer.to,
            timestamp: parseInt(transfer.timestamp),
            transactionHash: transfer.transactionHash,
          });
        }
      }
    }

    // Add order events (listings, cancellations, etc.)
    if (data.orderEvents) {
      for (const event of data.orderEvents) {
        let eventType = 'listing';
        if (event.type === 'CANCEL') eventType = 'cancel';
        if (event.type === 'OFFER') eventType = 'offer';
        if (event.type === 'BID') eventType = 'bid';

        activity.push({
          id: `order-${event.id}`,
          type: eventType as any,
          price: event.price ? (parseFloat(event.price) / 1e18).toString() : undefined,
          currency: event.currency,
          currencySymbol: event.currencySymbol,
          from: event.maker,
          timestamp: parseInt(event.timestamp),
          transactionHash: event.transactionHash,
        });
      }
    }

    // Sort by timestamp descending
    activity.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      activity: activity.slice(0, 50), // Limit to 50 most recent
    });
  } catch (error) {
    console.error('Error fetching token activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
