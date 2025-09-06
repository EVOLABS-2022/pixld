import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { subgraphClient } from '@/lib/graphql';
import { gql } from 'graphql-request';

const prisma = new PrismaClient();

const GET_COLLECTION_QUERY = gql`
  query GetCollection($id: ID!) {
    collection(id: $id) {
      id
      address
      name
      symbol
      standard
      description
      imageUrl
      bannerUrl
      verified
      featured
      creator {
        id
        address
        displayName
      }
      totalSupply
      ownersCount
      floorPrice
      volume24h
      volumeTotal
      royaltyReceiver
      royaltyBps
      createdAt
      lastActivityAt
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const resolvedParams = await params;
    const address = resolvedParams.address.toLowerCase();
    
    // First check cache
    const cached = await prisma.collectionCache.findUnique({
      where: { address },
    });

    if (cached && Date.now() - cached.lastUpdated.getTime() < 5 * 60 * 1000) {
      return NextResponse.json(cached.data);
    }

    // Fetch from subgraph
    const data = await subgraphClient.request(GET_COLLECTION_QUERY, {
      id: address,
    });

    if (!data.collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = data.collection;

    // Format the response
    const formattedCollection = {
      id: collection.id,
      address: collection.address,
      name: collection.name,
      symbol: collection.symbol,
      standard: collection.standard,
      description: collection.description,
      imageUrl: collection.imageUrl,
      bannerUrl: collection.bannerUrl,
      verified: collection.verified || false,
      featured: collection.featured || false,
      creator: {
        id: collection.creator?.id,
        address: collection.creator?.address,
        displayName: collection.creator?.displayName,
      },
      totalSupply: parseInt(collection.totalSupply || '0'),
      ownersCount: parseInt(collection.ownersCount || '0'),
      floorPrice: collection.floorPrice ? parseFloat(collection.floorPrice) / 1e18 : null,
      volume24h: parseFloat(collection.volume24h || '0') / 1e18,
      volumeTotal: parseFloat(collection.volumeTotal || '0') / 1e18,
      royaltyReceiver: collection.royaltyReceiver,
      royaltyBps: parseInt(collection.royaltyBps || '0'),
      createdAt: parseInt(collection.createdAt),
      lastActivityAt: parseInt(collection.lastActivityAt || '0'),
    };

    // Update cache
    await prisma.collectionCache.upsert({
      where: { address },
      update: {
        data: formattedCollection,
        lastUpdated: new Date(),
      },
      create: {
        address,
        data: formattedCollection,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(formattedCollection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
