import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { BuyModal } from "@/components/marketplace/buy-modal";
import { ListModal } from "@/components/marketplace/list-modal";
import { Activity } from "@/components/nfts/activity";
import { NFTProperties } from "@/components/nfts/properties";
import { 
  Heart, 
  ExternalLink, 
  Share, 
  MoreHorizontal,
  Verified,
  Clock,
  Eye,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface NFTPageProps {
  params: {
    address: string;
    tokenId: string;
  };
}

async function getNFT(address: string, tokenId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections/${address}/tokens/${tokenId}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch NFT');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching NFT:', error);
    return null;
  }
}

async function getNFTActivity(address: string, tokenId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections/${address}/tokens/${tokenId}/activity`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) throw new Error('Failed to fetch activity');
    
    const data = await res.json();
    return data.activity || [];
  } catch (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
}

export default async function NFTPage({ params }: NFTPageProps) {
  const [nft, activity] = await Promise.all([
    getNFT(params.address, params.tokenId),
    getNFTActivity(params.address, params.tokenId)
  ]);

  if (!nft) {
    notFound();
  }

  const isListed = !!nft.listing;
  const now = Math.floor(Date.now() / 1000);
  const isActiveListing = isListed && 
    (!nft.listing.start || nft.listing.start <= now) &&
    (!nft.listing.end || nft.listing.end > now);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image & Properties */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="aspect-square relative">
                <img
                  src={nft.imageUrl || '/api/placeholder/600/600'}
                  alt={nft.name || `${nft.collection.name} #${nft.tokenId}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                
                {/* Action Buttons Overlay */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                    <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                  </button>
                  <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                    <Share className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Listing Status Badge */}
                {isActiveListing && (
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="default" className="bg-green-600 text-white">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      For Sale
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Properties */}
            {nft.properties && nft.properties.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
                <NFTProperties properties={nft.properties} />
              </div>
            )}

            {/* Description */}
            {nft.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed">{nft.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Details & Actions */}
          <div className="space-y-6">
            {/* NFT Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Collection Link */}
              <div className="flex items-center space-x-2 mb-3">
                <Link 
                  href={`/collections/${nft.collection.address}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {nft.collection.name}
                </Link>
                {nft.collection.verified && (
                  <Verified className="h-4 w-4 text-blue-600" />
                )}
                <Badge variant="secondary">{nft.collection.standard}</Badge>
              </div>

              {/* NFT Name */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {nft.name || `${nft.collection.name} #${nft.tokenId}`}
              </h1>

              {/* Owner */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <span>Owned by</span>
                <Link 
                  href={`/users/${nft.owner.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {nft.owner.displayName || `${nft.owner.address.slice(0, 6)}...${nft.owner.address.slice(-4)}`}
                </Link>
              </div>

              {/* Views & Favorites */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{nft.viewsCount || 0} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{nft.favoritesCount || 0} favorites</span>
                </div>
              </div>
            </div>

            {/* Pricing & Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {isActiveListing ? (
                <div>
                  {/* Current Price */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Current price</div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-3xl font-bold text-gray-900">
                        Ξ{nft.listing.price}
                      </div>
                      {nft.listing.currency !== '0x0000000000000000000000000000000000000000' && (
                        <div className="text-lg text-gray-500">
                          {nft.listing.currencySymbol || 'ERC20'}
                        </div>
                      )}
                    </div>
                    
                    {/* USD equivalent */}
                    <div className="text-sm text-gray-500 mt-1">
                      ≈ $2,150.50 USD
                    </div>
                  </div>

                  {/* Listing Expiry */}
                  {nft.listing.end && (
                    <div className="flex items-center space-x-1 text-sm text-orange-600 mb-4">
                      <Clock className="h-4 w-4" />
                      <span>
                        Sale ends {new Date(nft.listing.end * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Buy Button */}
                  <BuyModal nft={nft}>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                      <ShoppingCart className="h-5 w-5 inline mr-2" />
                      Buy now
                    </button>
                  </BuyModal>

                  {/* Make Offer Button */}
                  <button className="w-full mt-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors">
                    Make offer
                  </button>
                </div>
              ) : (
                <div>
                  {/* Not Listed */}
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <ShoppingCart className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Not for sale
                    </h3>
                    <p className="text-gray-600 mb-6">
                      This item is not currently listed for sale.
                    </p>

                    {/* Last Sale Price */}
                    {nft.lastSale && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-sm text-gray-500">Last sold for</div>
                        <div className="text-xl font-bold text-gray-900">
                          Ξ{nft.lastSale.price}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(nft.lastSale.timestamp * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Action buttons for owner */}
                    <div className="space-y-3">
                      <ListModal nft={nft}>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                          List for sale
                        </button>
                      </ListModal>
                      
                      <button className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors">
                        Make offer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Contract Address</span>
                  <Link 
                    href={`https://etherscan.io/address/${nft.collection.address}`}
                    className="text-blue-600 hover:text-blue-700 font-mono"
                  >
                    {nft.collection.address.slice(0, 6)}...{nft.collection.address.slice(-4)}
                    <ExternalLink className="h-3 w-3 inline ml-1" />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token ID</span>
                  <span className="font-mono">{nft.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token Standard</span>
                  <span>{nft.collection.standard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Blockchain</span>
                  <span>Abstract</span>
                </div>
                {nft.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span>{new Date(nft.createdAt * 1000).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity</h3>
          <Activity activity={activity} />
        </div>
      </main>
    </div>
  );
}