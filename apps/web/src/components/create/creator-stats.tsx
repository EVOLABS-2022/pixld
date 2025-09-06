import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Users, Coins } from "lucide-react";

interface CreatorStatsProps {
  creator: {
    collections: Array<{
      id: string;
      address: string;
      name: string;
      symbol: string;
      standard: string;
      totalSupply: number;
      mintedCount: number;
      maxSupply: number | null;
      volume: string;
      royalty: number;
      verified: boolean;
      featured: boolean;
      createdAt: number;
    }>;
    stats: {
      collectionsCount: number;
      totalMinted: number;
      totalVolume: string;
      totalRoyalties: string;
      activeListings: number;
    };
  };
}

export function CreatorStats({ creator }: CreatorStatsProps) {
  return (
    <div className="space-y-6">
      {/* Collections List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Collections</h3>
        <div className="space-y-4">
          {creator.collections.map(collection => (
            <div key={collection.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                    <Badge variant="secondary">{collection.standard}</Badge>
                    {collection.verified && (
                      <Badge variant="default" className="bg-blue-600">Verified</Badge>
                    )}
                    {collection.featured && (
                      <Badge variant="default" className="bg-yellow-600">Featured</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    Symbol: {collection.symbol} • Created: {new Date(collection.createdAt * 1000).toLocaleDateString()}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Minted</div>
                      <div className="font-medium text-gray-900">
                        {collection.mintedCount}/{collection.maxSupply || '∞'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Volume</div>
                      <div className="font-medium text-gray-900">Ξ{collection.volume}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Royalty</div>
                      <div className="font-medium text-gray-900">{(collection.royalty / 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Supply</div>
                      <div className="font-medium text-gray-900">{collection.totalSupply}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/collections/${collection.address}`}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View Collection"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/create?tab=mint&collection=${collection.id}`}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Mint
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume Chart Placeholder */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Sales Volume</h4>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div className="text-sm text-gray-500">Volume chart placeholder</div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-gray-900">Ξ{creator.stats.totalVolume}</div>
              <div className="text-sm text-gray-500">Total Volume</div>
            </div>
          </div>

          {/* Top Performing Collection */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Top Collection</h4>
              <Coins className="h-5 w-5 text-yellow-500" />
            </div>
            
            {creator.collections.length > 0 && (
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {creator.collections.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))[0].name}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Ξ{creator.collections.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))[0].volume} volume
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="text-gray-900">
                      {creator.collections.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))[0].totalSupply}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Royalties Earned</span>
                    <span className="text-gray-900">
                      Ξ{(parseFloat(creator.collections.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))[0].volume) * 
                        creator.collections.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))[0].royalty / 10000).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 text-center text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No recent activity</div>
            <div className="text-xs text-gray-400 mt-1">
              Sales, mints, and transfers will appear here
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/create?tab=new-collection"
            className="p-4 border border-gray-200 hover:border-blue-300 rounded-lg text-center transition-colors group"
          >
            <div className="text-2xl mb-2">🎨</div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              New Collection
            </div>
          </Link>
          
          <Link
            href="/create?tab=mint"
            className="p-4 border border-gray-200 hover:border-blue-300 rounded-lg text-center transition-colors group"
          >
            <div className="text-2xl mb-2">✨</div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              Mint NFT
            </div>
          </Link>
          
          <button className="p-4 border border-gray-200 hover:border-blue-300 rounded-lg text-center transition-colors group">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              Analytics
            </div>
          </button>
          
          <button className="p-4 border border-gray-200 hover:border-blue-300 rounded-lg text-center transition-colors group">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              Promote
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}