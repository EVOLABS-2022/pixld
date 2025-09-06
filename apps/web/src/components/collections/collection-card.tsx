import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, formatNumber, shortenAddress, getIPFSUrl } from '@/lib/utils';
import { Collection } from '@/lib/subgraph';
import { Badge } from '@/components/ui/badge';

interface CollectionCardProps {
  collection: Collection;
  showStats?: boolean;
  className?: string;
}

export function CollectionCard({ 
  collection, 
  showStats = true, 
  className = '' 
}: CollectionCardProps) {
  const imageUrl = collection.contractURI ? getIPFSUrl(collection.contractURI) : '';
  
  return (
    <Link 
      href={`/collections/${collection.address}`}
      className={`group block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* Collection Image */}
      <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={collection.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-4xl font-bold text-gray-400">
              {collection.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {collection.isFeatured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              Featured
            </Badge>
          )}
          {collection.deployedViaFactory && (
            <Badge className="bg-green-500 hover:bg-green-600">
              Verified
            </Badge>
          )}
          <Badge variant="secondary">
            {collection.standard}
          </Badge>
        </div>
      </div>

      {/* Collection Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {collection.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {collection.symbol}
            </p>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span>by</span>
          <span className="ml-1 font-medium text-gray-700">
            {shortenAddress(collection.creator.address)}
          </span>
        </div>

        {showStats && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Floor Price</p>
              <p className="text-sm font-semibold text-gray-900">
                {collection.floorPrice 
                  ? formatPrice(collection.floorPrice)
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">24h Volume</p>
              <p className="text-sm font-semibold text-gray-900">
                {collection.volume24h !== '0'
                  ? formatPrice(collection.volume24h)
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Items</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatNumber(parseInt(collection.totalSupply || '0'))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Royalty</p>
              <p className="text-sm font-semibold text-gray-900">
                {(Number(collection.royaltyBps) / 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}