import { prisma } from './prisma';
import { getCollections, getRecentSales, querySubgraph } from './subgraph';

export async function updateCollectionCache(): Promise<void> {
  try {
    console.log('Starting collection cache update...');
    
    // Get all whitelisted collections from subgraph
    const collections = await getCollections({
      first: 1000, // Get all collections
      where: { isWhitelisted: true },
    });
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (const collection of collections) {
      try {
        // Get sales data for this collection
        const salesQuery = `
          query GetCollectionSales($collection: Bytes!, $oneDayAgo: BigInt!, $oneWeekAgo: BigInt!) {
            sales24h: sales(
              where: { collection: $collection, timestamp_gt: $oneDayAgo }
              orderBy: timestamp
              orderDirection: desc
            ) {
              price
              timestamp
            }
            sales7d: sales(
              where: { collection: $collection, timestamp_gt: $oneWeekAgo }
              orderBy: timestamp
              orderDirection: desc
            ) {
              price
              timestamp
            }
            salesTotal: sales(
              where: { collection: $collection }
              orderBy: timestamp
              orderDirection: desc
              first: 1
            ) {
              price
              timestamp
            }
            allSales: sales(
              where: { collection: $collection }
              orderBy: price
              orderDirection: asc
              first: 1000
            ) {
              price
            }
          }
        `;
        
        const salesData = await querySubgraph<{
          sales24h: Array<{ price: string; timestamp: string }>;
          sales7d: Array<{ price: string; timestamp: string }>;
          salesTotal: Array<{ price: string; timestamp: string }>;
          allSales: Array<{ price: string }>;
        }>(salesQuery, {
          collection: collection.address.toLowerCase(),
          oneDayAgo: Math.floor(oneDayAgo.getTime() / 1000).toString(),
          oneWeekAgo: Math.floor(oneWeekAgo.getTime() / 1000).toString(),
        });
        
        // Calculate metrics
        const volume24h = salesData.sales24h.reduce(
          (sum, sale) => sum + BigInt(sale.price),
          BigInt(0)
        ).toString();
        
        const volume7d = salesData.sales7d.reduce(
          (sum, sale) => sum + BigInt(sale.price),
          BigInt(0)
        ).toString();
        
        const volumeTotal = collection.volumeTotal || '0';
        
        const sales24hCount = salesData.sales24h.length;
        const sales7dCount = salesData.sales7d.length;
        
        // Calculate floor price (lowest active listing)
        // For now, use the lowest recent sale price as approximation
        const floorPrice = salesData.allSales.length > 0 
          ? salesData.allSales[0].price 
          : null;
        
        // Get last sale info
        const lastSale = salesData.salesTotal[0];
        const lastSalePrice = lastSale?.price || null;
        const lastSaleTime = lastSale?.timestamp 
          ? new Date(parseInt(lastSale.timestamp) * 1000)
          : null;
        
        // Calculate trending score (simple algorithm)
        // Based on 24h volume, sales count, and recency
        const volume24hNum = parseFloat(volume24h) / 1e18; // Convert to ETH
        const trendingScore = (
          Math.log10(Math.max(volume24hNum, 0.001)) * 10 +
          sales24hCount * 2 +
          (lastSaleTime ? Math.max(0, 24 - (now.getTime() - lastSaleTime.getTime()) / (1000 * 60 * 60)) : 0)
        );
        
        // Upsert collection cache
        await prisma.collectionCache.upsert({
          where: { contractAddress: collection.address.toLowerCase() },
          create: {
            contractAddress: collection.address.toLowerCase(),
            floorPrice,
            volume24h,
            volume7d,
            volumeTotal,
            sales24h: sales24hCount,
            sales7d: sales7dCount,
            salesTotal: parseInt(collection.totalSupply || '0'), // Approximation
            lastSalePrice,
            lastSaleTime,
            trendingScore,
          },
          update: {
            floorPrice,
            volume24h,
            volume7d,
            volumeTotal,
            sales24h: sales24hCount,
            sales7d: sales7dCount,
            lastSalePrice,
            lastSaleTime,
            trendingScore,
            updatedAt: now,
          },
        });
        
        console.log(`Updated cache for collection ${collection.name} (${collection.address})`);
        
      } catch (error) {
        console.error(`Error updating cache for collection ${collection.address}:`, error);
      }
    }
    
    console.log('Collection cache update completed');
    
  } catch (error) {
    console.error('Error updating collection cache:', error);
    throw error;
  }
}

export async function updateTrendingCollections(): Promise<void> {
  try {
    console.log('Updating trending collections...');
    
    const periods = ['24h', '7d', '30d'];
    
    for (const period of periods) {
      // Get collections sorted by volume for this period
      const collections = await prisma.collectionCache.findMany({
        orderBy: period === '24h' ? { volume24h: 'desc' } : { volume7d: 'desc' },
        take: 50, // Top 50 trending
      });
      
      // Clear old trending data for this period
      await prisma.trendingCollections.deleteMany({
        where: { period },
      });
      
      // Insert new trending data
      const trendingData = collections.map((collection, index) => ({
        contractAddress: collection.contractAddress,
        rank: index + 1,
        period,
        volume: period === '24h' ? collection.volume24h : collection.volume7d,
        percentChange: 0, // TODO: Calculate percentage change
        calculatedAt: new Date(),
      }));
      
      await prisma.trendingCollections.createMany({
        data: trendingData,
      });
      
      console.log(`Updated ${trendingData.length} trending collections for period: ${period}`);
    }
    
  } catch (error) {
    console.error('Error updating trending collections:', error);
    throw error;
  }
}

// Function to run all cache updates
export async function runCacheUpdate(): Promise<void> {
  try {
    await updateCollectionCache();
    await updateTrendingCollections();
    console.log('All cache updates completed successfully');
  } catch (error) {
    console.error('Cache update failed:', error);
    throw error;
  }
}