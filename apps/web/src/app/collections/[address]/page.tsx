import { Header } from "@/components/layout/header";
import { NFTCard } from "@/components/nfts/nft-card";
import { Badge } from "@/components/ui/badge";
import { Verified, Filter, SortAsc, Grid, List } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CollectionPageProps {
  params: {
    address: string;
  };
  searchParams: {
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    availability?: string;
    orderBy?: string;
    orderDirection?: string;
    view?: string;
  };
}

async function getCollection(address: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections/${address}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch collection');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

async function getCollectionNFTs(address: string, searchParams: any) {
  try {
    const params = new URLSearchParams();
    
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
    if (searchParams.availability) params.set('availability', searchParams.availability);
    if (searchParams.orderBy) params.set('orderBy', searchParams.orderBy);
    if (searchParams.orderDirection) params.set('orderDirection', searchParams.orderDirection);
    
    params.set('limit', '20');
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections/${address}/tokens?${params.toString()}`, {
      next: { revalidate: 120 } // Cache for 2 minutes
    });
    
    if (!res.ok) throw new Error('Failed to fetch NFTs');
    
    const data = await res.json();
    return {
      tokens: data.tokens || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    console.error('Error fetching collection NFTs:', error);
    return {
      tokens: [],
      pagination: {}
    };
  }
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const [collection, { tokens, pagination }] = await Promise.all([
    getCollection(params.address),
    getCollectionNFTs(params.address, searchParams)
  ]);

  if (!collection) {
    notFound();
  }

  const currentPage = parseInt(searchParams.page || '1');
  const isGridView = searchParams.view !== 'list';
  const isFiltered = searchParams.minPrice || searchParams.maxPrice || searchParams.availability;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Collection Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Collection Image */}
            <div className="flex-shrink-0">
              <img
                src={collection.imageUrl || '/api/placeholder/200/200'}
                alt={collection.name}
                className="w-32 h-32 lg:w-48 lg:h-48 rounded-lg object-cover"
              />
            </div>
            
            {/* Collection Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
                <Badge variant="secondary">{collection.standard}</Badge>
                {collection.verified && (
                  <div className="flex items-center text-blue-600">
                    <Verified className="h-5 w-5" />
                  </div>
                )}
              </div>
              
              {collection.description && (
                <p className="text-gray-600 mb-4 text-lg">{collection.description}</p>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collection.totalSupply?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500">Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collection.ownersCount?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500">Owners</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collection.floorPrice ? `Ξ${collection.floorPrice}` : '--'}
                  </div>
                  <div className="text-sm text-gray-500">Floor Price</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collection.volume24h ? `Ξ${collection.volume24h}` : '0'}
                  </div>
                  <div className="text-sm text-gray-500">24h Volume</div>
                </div>
              </div>
              
              {/* Creator & Links */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created by </span>
                  <Link 
                    href={`/users/${collection.creator?.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {collection.creator?.displayName || `${collection.creator?.address?.slice(0, 6)}...${collection.creator?.address?.slice(-4)}`}
                  </Link>
                </div>
                <div>
                  <span className="text-gray-500">Royalty: </span>
                  <span className="font-medium">{(collection.royaltyBps / 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Price Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={searchParams.availability || ''}
              >
                <option value="">All Items</option>
                <option value="listed">Listed</option>
                <option value="unlisted">Not Listed</option>
              </select>
            </div>

            {/* Price Range Inputs */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                step="0.001"
                className="w-20 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={searchParams.minPrice || ''}
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                step="0.001"
                className="w-20 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={searchParams.maxPrice || ''}
              />
              <span className="text-gray-500 text-sm">ETH</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={`${searchParams.orderBy || 'tokenId'}_${searchParams.orderDirection || 'asc'}`}
              >
                <option value="tokenId_asc">Token ID ↑</option>
                <option value="tokenId_desc">Token ID ↓</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="lastSale_desc">Recently Sold</option>
                <option value="listedAt_desc">Recently Listed</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <Link
                href={`/collections/${params.address}?${new URLSearchParams({...searchParams, view: 'grid'}).toString()}`}
                className={`p-2 ${isGridView ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid className="h-4 w-4" />
              </Link>
              <Link
                href={`/collections/${params.address}?${new URLSearchParams({...searchParams, view: 'list'}).toString()}`}
                className={`p-2 ${!isGridView ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* NFTs Grid/List */}
        {tokens.length > 0 ? (
          <>
            {isGridView ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {tokens.map((token: any) => (
                  <NFTCard
                    key={token.id}
                    nft={token}
                    collection={collection}
                    showCollection={false}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Sale
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tokens.map((token: any) => (
                        <tr key={token.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={token.imageUrl || '/api/placeholder/48/48'}
                                alt={token.name}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {token.name || `#${token.tokenId}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{token.tokenId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {token.listing ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Ξ{token.listing.price}
                                </div>
                                {token.listing.currency !== '0x0000000000000000000000000000000000000000' && (
                                  <div className="text-xs text-gray-500">
                                    {token.listing.currencySymbol}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">--</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {token.lastSale ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  Ξ{token.lastSale.price}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(token.lastSale.timestamp * 1000).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">--</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              href={`/users/${token.owner?.id}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              {token.owner?.displayName || `${token.owner?.address?.slice(0, 6)}...${token.owner?.address?.slice(-4)}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {token.listing ? (
                              <Link
                                href={`/collections/${params.address}/${token.tokenId}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                              >
                                Buy Now
                              </Link>
                            ) : (
                              <Link
                                href={`/collections/${params.address}/${token.tokenId}`}
                                className="text-gray-400 cursor-not-allowed px-4 py-2 text-sm"
                              >
                                Not Listed
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {(pagination.hasMore || currentPage > 1) && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/collections/${params.address}?${new URLSearchParams({
                        ...searchParams,
                        page: (currentPage - 1).toString()
                      }).toString()}`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {currentPage}
                  </span>
                  
                  {pagination.hasMore && (
                    <Link
                      href={`/collections/${params.address}?${new URLSearchParams({
                        ...searchParams,
                        page: (currentPage + 1).toString()
                      }).toString()}`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No NFTs found
            </h3>
            <p className="text-gray-600">
              {isFiltered 
                ? 'Try adjusting your filters to see more items.'
                : 'This collection doesn\'t have any minted NFTs yet.'
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}