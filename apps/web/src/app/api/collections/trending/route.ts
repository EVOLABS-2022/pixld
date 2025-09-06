import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCollection } from '@/lib/subgraph';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '24h';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    
    if (!['24h', '7d', '30d'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: 24h, 7d, 30d' },
        { status: 400 }
      );
    }
    
    // Get trending collections from cache
    const trending = await prisma.trendingCollections.findMany({
      where: { period },
      orderBy: { rank: 'asc' },
      take: limit,
    });
    
    // Enrich with collection data from subgraph
    const enrichedTrending = await Promise.all(
      trending.map(async (item) => {
        try {
          const collection = await getCollection(item.contractAddress);
          const cache = await prisma.collectionCache.findUnique({
            where: { contractAddress: item.contractAddress },
          });
          
          return {
            rank: item.rank,
            period: item.period,
            volume: item.volume,
            percentChange: item.percentChange,
            collection: collection ? {
              ...collection,
              floorPrice: cache?.floorPrice || collection.floorPrice,
              volume24h: cache?.volume24h || collection.volume24h,
              volumeTotal: cache?.volumeTotal || collection.volumeTotal,
            } : null,
            lastCalculated: item.calculatedAt,
          };
        } catch (error) {
          console.error(`Error enriching trending collection ${item.contractAddress}:`, error);
          return {
            rank: item.rank,
            period: item.period,
            volume: item.volume,
            percentChange: item.percentChange,
            collection: null,
            lastCalculated: item.calculatedAt,
          };
        }
      })
    );
    
    // Filter out collections where we couldn't fetch data
    const validTrending = enrichedTrending.filter(item => item.collection !== null);
    
    return NextResponse.json({
      trending: validTrending,
      period,
      limit,
      count: validTrending.length,
    });
    
  } catch (error) {
    console.error('Error fetching trending collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending collections' },
      { status: 500 }
    );
  }
}