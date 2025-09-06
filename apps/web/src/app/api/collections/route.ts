import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/subgraph';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const orderDirection = (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc';
    const featured = searchParams.get('featured');
    const whitelisted = searchParams.get('whitelisted');
    const standard = searchParams.get('standard');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Record<string, any> = {};
    
    if (featured === 'true') {
      where.isFeatured = true;
    }
    
    if (whitelisted !== 'false') { // Default to only whitelisted
      where.isWhitelisted = true;
    }
    
    if (standard && ['ERC721C', 'ERC1155'].includes(standard)) {
      where.standard = standard;
    }
    
    // Get collections from subgraph
    const collections = await getCollections({
      first: limit,
      skip,
      orderBy,
      orderDirection,
      where,
    });
    
    // Get cached floor prices and trending data from DB
    const collectionsWithCache = await Promise.all(
      collections.map(async (collection) => {
        const cached = await prisma.collection.findUnique({
          where: { contractAddress: collection.address },
        });
        
        return {
          ...collection,
          floorPrice: cached?.floorPrice || collection.floorPrice,
          volume24h: cached?.volume24h || collection.volume24h,
          volumeTotal: cached?.volumeTotal || collection.volumeTotal,
        };
      })
    );
    
    return NextResponse.json({
      collections: collectionsWithCache,
      pagination: {
        page,
        limit,
        hasMore: collections.length === limit,
      },
    });
    
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}