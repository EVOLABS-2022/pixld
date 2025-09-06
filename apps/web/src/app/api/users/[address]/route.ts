import { NextRequest, NextResponse } from 'next/server';
import { getUserTokens, getRecentSales } from '@/lib/subgraph';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid user address' },
        { status: 400 }
      );
    }
    
    const includeTokens = searchParams.get('includeTokens') !== 'false'; // Default true
    const includeSales = searchParams.get('includeSales') === 'true';
    
    const result: any = {
      address: address.toLowerCase(),
    };
    
    if (includeTokens) {
      const tokenPage = parseInt(searchParams.get('tokenPage') || '1');
      const tokenLimit = Math.min(parseInt(searchParams.get('tokenLimit') || '50'), 100);
      const tokenSkip = (tokenPage - 1) * tokenLimit;
      
      const tokens = await getUserTokens(address, {
        first: tokenLimit,
        skip: tokenSkip,
      });
      
      result.tokens = tokens;
      result.tokenPagination = {
        page: tokenPage,
        limit: tokenLimit,
        hasMore: tokens.length === tokenLimit,
      };
    }
    
    if (includeSales) {
      const salesPage = parseInt(searchParams.get('salesPage') || '1');
      const salesLimit = Math.min(parseInt(searchParams.get('salesLimit') || '20'), 100);
      const salesSkip = (salesPage - 1) * salesLimit;
      
      // Get recent sales where user was buyer or seller
      const sales = await getRecentSales({
        first: salesLimit,
        skip: salesSkip,
      });
      
      // Filter to only include sales involving this user
      const userSales = sales.filter(sale => 
        sale.seller.address.toLowerCase() === address.toLowerCase() ||
        sale.buyer.address.toLowerCase() === address.toLowerCase()
      );
      
      result.sales = userSales;
      result.salesPagination = {
        page: salesPage,
        limit: salesLimit,
        hasMore: userSales.length === salesLimit,
      };
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}