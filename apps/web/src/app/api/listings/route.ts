import { NextRequest, NextResponse } from 'next/server';
import { getRecentSales } from '@/lib/subgraph';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const collectionAddress = searchParams.get('collection');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const skip = (page - 1) * limit;
    
    // For now, we'll return recent sales as "listing activity"
    // In a real implementation, you'd track active listings separately
    const sales = await getRecentSales({
      first: limit,
      skip,
      ...(collectionAddress && { collectionAddress }),
    });
    
    // Filter by price range if specified
    let filteredSales = sales;
    if (minPrice || maxPrice) {
      filteredSales = sales.filter(sale => {
        const price = BigInt(sale.price);
        if (minPrice && price < BigInt(minPrice)) return false;
        if (maxPrice && price > BigInt(maxPrice)) return false;
        return true;
      });
    }
    
    return NextResponse.json({
      listings: filteredSales, // These are recent sales, representing listing activity
      pagination: {
        page,
        limit,
        hasMore: filteredSales.length === limit,
      },
      meta: {
        note: "Currently showing recent sales. Active listings tracking coming soon.",
      },
    });
    
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a listing (placeholder for future implementation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This would integrate with the marketplace contract
    // For now, return a placeholder response
    return NextResponse.json({
      message: "Listing creation endpoint - implementation coming soon",
      data: body,
    });
    
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}