import { NextRequest, NextResponse } from 'next/server';
import { runCacheUpdate } from '@/lib/cache-updater';

export async function POST(request: NextRequest) {
  try {
    // In production, you'd want to add authentication here
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Starting manual cache update...');
    await runCacheUpdate();
    
    return NextResponse.json({
      success: true,
      message: 'Cache update completed successfully',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Cache update failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cache update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}