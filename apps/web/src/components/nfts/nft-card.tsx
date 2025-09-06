import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink } from "lucide-react";

interface NFTCardProps {
  nft: {
    id: string;
    tokenId: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    collection: {
      id: string;
      address: string;
      name: string;
      symbol: string;
    };
    owner: {
      id: string;
      address: string;
      displayName?: string;
    };
    listing?: {
      id: string;
      price: string;
      currency: string;
      currencySymbol?: string;
      maker: string;
      start?: number;
      end?: number;
    };
    lastSale?: {
      price: string;
      timestamp: number;
      currency: string;
    };
  };
  collection?: {
    address: string;
    name: string;
    symbol: string;
    standard: string;
  };
  showCollection?: boolean;
  className?: string;
}

export function NFTCard({ 
  nft, 
  collection: collectionOverride, 
  showCollection = true,
  className = ""
}: NFTCardProps) {
  const collection = collectionOverride || nft.collection;
  const displayName = nft.name || `${collection.name} #${nft.tokenId}`;
  const isListed = !!nft.listing;
  
  // Check if listing is active
  const now = Math.floor(Date.now() / 1000);
  const isActivelisting = isListed && 
    (!nft.listing!.start || nft.listing!.start <= now) &&
    (!nft.listing!.end || nft.listing!.end > now);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      {/* NFT Image */}
      <div className="aspect-square relative">
        <Link href={`/collections/${collection.address}/${nft.tokenId}`}>
          <img
            src={nft.imageUrl || '/api/placeholder/400/400'}
            alt={displayName}
            className="w-full h-full object-cover rounded-t-lg cursor-pointer hover:opacity-95 transition-opacity"
          />
        </Link>
        
        {/* Favorite Button */}
        <button className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
        </button>
        
        {/* Listing Badge */}
        {isActivelisting && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="bg-green-600 text-white">
              Listed
            </Badge>
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="p-4">
        {/* Collection Name (if showing) */}
        {showCollection && (
          <div className="text-xs text-gray-500 mb-1">
            <Link 
              href={`/collections/${collection.address}`}
              className="hover:text-gray-700"
            >
              {collection.name}
            </Link>
          </div>
        )}

        {/* NFT Name & Token ID */}
        <div className="mb-2">
          <Link href={`/collections/${collection.address}/${nft.tokenId}`}>
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1">
              {displayName}
            </h3>
          </Link>
          <p className="text-sm text-gray-500">#{nft.tokenId}</p>
        </div>

        {/* Price Info */}
        <div className="flex items-center justify-between mb-3">
          <div>
            {isActivelisting ? (
              <div>
                <div className="text-lg font-bold text-gray-900">
                  Ξ{nft.listing!.price}
                </div>
                {nft.listing!.currency !== '0x0000000000000000000000000000000000000000' && (
                  <div className="text-xs text-gray-500">
                    {nft.listing!.currencySymbol || 'ERC20'}
                  </div>
                )}
              </div>
            ) : nft.lastSale ? (
              <div>
                <div className="text-sm text-gray-600">
                  Last: Ξ{nft.lastSale.price}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(nft.lastSale.timestamp * 1000).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Not listed
              </div>
            )}
          </div>

          {/* External Link */}
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* Owner Info */}
        <div className="text-xs text-gray-500 mb-3">
          Owned by{' '}
          <Link 
            href={`/users/${nft.owner.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {nft.owner.displayName || `${nft.owner.address.slice(0, 6)}...${nft.owner.address.slice(-4)}`}
          </Link>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-gray-100">
          {isActivelisting ? (
            <Link
              href={`/collections/${collection.address}/${nft.tokenId}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors text-center block"
            >
              Buy Now
            </Link>
          ) : (
            <Link
              href={`/collections/${collection.address}/${nft.tokenId}`}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-md transition-colors text-center block"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}