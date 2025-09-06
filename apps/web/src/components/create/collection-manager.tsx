'use client';

import { useState } from 'react';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Settings, 
  Pause, 
  Play, 
  Edit3, 
  Upload,
  TrendingUp,
  Users,
  Eye,
  MoreHorizontal
} from "lucide-react";

interface Collection {
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
}

interface CollectionManagerProps {
  collections: Collection[];
}

export function CollectionManager({ collections }: CollectionManagerProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<string | null>(null);

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Settings className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Found</h3>
        <p className="text-gray-600 mb-6">
          Create your first collection to start managing your NFTs.
        </p>
        <Link
          href="/create?tab=new-collection"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Create Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {collections.map(collection => (
        <div key={collection.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Collection Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
                    <Badge variant="secondary">{collection.standard}</Badge>
                    {collection.verified && (
                      <Badge variant="default" className="bg-blue-600">Verified</Badge>
                    )}
                    {collection.featured && (
                      <Badge variant="default" className="bg-yellow-600">Featured</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {collection.symbol} • Created {new Date(collection.createdAt * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/collections/${collection.address}`}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View Collection"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setShowSettings(showSettings === collection.id ? null : collection.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="More Options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Collection Stats */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{collection.mintedCount}</div>
                <div className="text-sm text-gray-500">Minted</div>
                <div className="text-xs text-gray-400">
                  of {collection.maxSupply || '∞'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">Ξ{collection.volume}</div>
                <div className="text-sm text-gray-500">Volume</div>
                <div className="text-xs text-green-600">
                  +12.5% this week
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(collection.royalty / 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Royalty</div>
                <div className="text-xs text-gray-400">
                  Ξ{(parseFloat(collection.volume) * collection.royalty / 10000).toFixed(3)} earned
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">45</div>
                <div className="text-sm text-gray-500">Owners</div>
                <div className="text-xs text-gray-400">
                  78% unique
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">Ξ0.05</div>
                <div className="text-sm text-gray-500">Floor</div>
                <div className="text-xs text-gray-400">
                  Last 24h
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/create?tab=mint&collection=${collection.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Mint NFT
              </Link>
              
              <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Details
              </button>
              
              <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </button>
              
              <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                <Users className="h-4 w-4 mr-2" />
                Holders
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings === collection.id && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Collection Settings</h4>
                  <div className="space-y-2 text-sm">
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Update metadata
                    </button>
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <Settings className="h-4 w-4 mr-2" />
                      Royalty settings
                    </button>
                    <button className="flex items-center text-orange-600 hover:text-orange-700">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause collection
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Minting</h4>
                  <div className="space-y-2 text-sm">
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk mint
                    </button>
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <Settings className="h-4 w-4 mr-2" />
                      Mint settings
                    </button>
                    {collection.maxSupply && (
                      <button className="flex items-center text-gray-600 hover:text-gray-900">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Increase supply
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Visibility</h4>
                  <div className="space-y-2 text-sm">
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <Eye className="h-4 w-4 mr-2" />
                      Request verification
                    </button>
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Submit for featuring
                    </button>
                    <button className="flex items-center text-gray-600 hover:text-gray-900">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Social links
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Need help managing your collections?</h3>
        <p className="text-blue-700 text-sm mb-4">
          Learn best practices for growing your NFT collections, optimizing royalties, and engaging with your community.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/docs/collection-management"
            className="px-3 py-1 bg-white hover:bg-gray-50 text-blue-700 text-sm rounded transition-colors"
          >
            Management Guide
          </Link>
          <Link
            href="/docs/royalty-optimization"
            className="px-3 py-1 bg-white hover:bg-gray-50 text-blue-700 text-sm rounded transition-colors"
          >
            Royalty Tips
          </Link>
          <Link
            href="/docs/analytics"
            className="px-3 py-1 bg-white hover:bg-gray-50 text-blue-700 text-sm rounded transition-colors"
          >
            Analytics Guide
          </Link>
        </div>
      </div>
    </div>
  );
}