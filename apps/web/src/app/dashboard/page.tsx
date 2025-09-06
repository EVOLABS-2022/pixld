import { Header } from "@/components/layout/header";
import { NFTCard } from "@/components/nfts/nft-card";
import { Badge } from "@/components/ui/badge";
import { 
  User,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Heart,
  Eye,
  Plus,
  Filter,
  Grid,
  List
} from "lucide-react";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: {
    tab?: string;
    page?: string;
    collection?: string;
    listed?: string;
    view?: string;
  };
}

// Mock user data - in real app this would come from wallet/auth
async function getCurrentUser() {
  // This would integrate with wallet connection
  return {
    id: "0x1234...5678",
    address: "0x1234567890123456789012345678901234567890",
    displayName: "Art Collector",
    bio: "Passionate collector of digital art and NFTs",
    avatarUrl: "/api/placeholder/80/80",
    bannerUrl: "/api/placeholder/800/200",
    joinedAt: 1640995200, // Jan 1, 2022
    verified: false,
    stats: {
      ownedCount: 42,
      createdCount: 8,
      listedCount: 5,
      soldCount: 12,
      volume: "15.7", // ETH
      floorValue: "8.2" // ETH
    }
  };
}

async function getUserNFTs(address: string, searchParams: any) {
  try {
    const params = new URLSearchParams();
    
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.collection) params.set('collection', searchParams.collection);
    if (searchParams.listed === 'true') params.set('listed', 'true');
    if (searchParams.listed === 'false') params.set('listed', 'false');
    
    params.set('limit', '20');
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${address}/tokens?${params.toString()}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) throw new Error('Failed to fetch NFTs');
    
    const data = await res.json();
    return {
      tokens: data.tokens || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return {
      tokens: [],
      pagination: {}
    };
  }
}

async function getUserActivity(address: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${address}/activity?limit=10`, {
      next: { revalidate: 120 }
    });
    
    if (!res.ok) throw new Error('Failed to fetch activity');
    
    const data = await res.json();
    return data.activity || [];
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  const activeTab = searchParams.tab || 'owned';
  const currentPage = parseInt(searchParams.page || '1');
  const isGridView = searchParams.view !== 'list';

  const [{ tokens, pagination }, activity] = await Promise.all([
    getUserNFTs(user.address, searchParams),
    activeTab === 'activity' ? getUserActivity(user.address) : []
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
          {/* Banner */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <img
              src={user.bannerUrl}
              alt="Profile banner"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16 sm:-mt-12">
              {/* Avatar */}
              <div className="relative mb-4 sm:mb-0">
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-white"
                />
                {user.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {user.displayName}
                  </h1>
                  {user.verified && (
                    <Badge variant="default" className="bg-blue-600">
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2 font-mono">
                  {user.address}
                </div>
                
                {user.bio && (
                  <p className="text-gray-700 mb-4">{user.bio}</p>
                )}
                
                <div className="text-sm text-gray-500">
                  Joined {new Date(user.joinedAt * 1000).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Edit Profile
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Wallet className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.ownedCount}</div>
                <div className="text-sm text-gray-500">Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.createdCount}</div>
                <div className="text-sm text-gray-500">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.listedCount}</div>
                <div className="text-sm text-gray-500">Listed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.soldCount}</div>
                <div className="text-sm text-gray-500">Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">Ξ{user.stats.volume}</div>
                <div className="text-sm text-gray-500">Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">Ξ{user.stats.floorValue}</div>
                <div className="text-sm text-gray-500">Floor Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'owned', name: 'Owned', icon: ShoppingCart, count: user.stats.ownedCount },
                { id: 'created', name: 'Created', icon: Plus, count: user.stats.createdCount },
                { id: 'activity', name: 'Activity', icon: TrendingUp },
                { id: 'favorites', name: 'Favorites', icon: Heart },
                { id: 'watching', name: 'Watching', icon: Eye },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <Link
                    key={tab.id}
                    href={`/dashboard?tab=${tab.id}`}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className={`${
                        isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      } rounded-full px-2 py-0.5 text-xs font-medium`}>
                        {tab.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {(activeTab === 'owned' || activeTab === 'created') && (
              <>
                {/* Filters & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue={searchParams.collection || ''}
                      >
                        <option value="">All Collections</option>
                        <option value="0x123...">Art Blocks</option>
                        <option value="0x456...">My Collection</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue={searchParams.listed || ''}
                      >
                        <option value="">All Items</option>
                        <option value="true">Listed</option>
                        <option value="false">Not Listed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {tokens.length} items
                    </span>
                    
                    {/* View Toggle */}
                    <div className="flex border border-gray-300 rounded-md">
                      <Link
                        href={`/dashboard?${new URLSearchParams({...searchParams, view: 'grid'}).toString()}`}
                        className={`p-2 ${isGridView ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <Grid className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard?${new URLSearchParams({...searchParams, view: 'list'}).toString()}`}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tokens.map((token: any) => (
                          <NFTCard
                            key={token.id}
                            nft={token}
                            showCollection={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sale</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tokens.map((token: any) => (
                              <tr key={token.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <img className="h-12 w-12 rounded-lg object-cover" src={token.imageUrl} alt={token.name} />
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{token.name || `#${token.tokenId}`}</div>
                                      <div className="text-sm text-gray-500">#{token.tokenId}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {token.collection.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {token.listing ? (
                                    <div className="text-sm font-medium text-gray-900">Ξ{token.listing.price}</div>
                                  ) : (
                                    <span className="text-sm text-gray-500">Not listed</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {token.lastSale ? (
                                    <div className="text-sm text-gray-900">Ξ{token.lastSale.price}</div>
                                  ) : (
                                    <span className="text-sm text-gray-500">--</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/collections/${token.collection.address}/${token.tokenId}`}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      View
                                    </Link>
                                    {!token.listing ? (
                                      <button className="text-green-600 hover:text-green-700">
                                        List
                                      </button>
                                    ) : (
                                      <button className="text-red-600 hover:text-red-700">
                                        Unlist
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {(pagination.hasMore || currentPage > 1) && (
                      <div className="flex justify-center mt-8">
                        <div className="flex items-center space-x-2">
                          {currentPage > 1 && (
                            <Link
                              href={`/dashboard?${new URLSearchParams({...searchParams, page: (currentPage - 1).toString()}).toString()}`}
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
                              href={`/dashboard?${new URLSearchParams({...searchParams, page: (currentPage + 1).toString()}).toString()}`}
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
                      <ShoppingCart className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No NFTs found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeTab === 'owned' 
                        ? "You don't own any NFTs yet. Start collecting!"
                        : "You haven't created any NFTs yet. Start creating!"
                      }
                    </p>
                    <Link
                      href="/collections"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {activeTab === 'owned' ? 'Browse Collections' : 'Create NFT'}
                    </Link>
                  </div>
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {activity.length > 0 ? (
                  activity.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <img src={item.token?.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {item.type === 'sale' ? 'Sold' : item.type === 'purchase' ? 'Bought' : 'Listed'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {item.token?.name || `#${item.token?.tokenId}`}
                          </span>
                          {item.price && (
                            <span className="text-sm font-medium text-gray-900">
                              for Ξ{item.price}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.timestamp * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-600">Your NFT activity will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'favorites' || activeTab === 'watching') && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  {activeTab === 'favorites' ? <Heart className="h-12 w-12 mx-auto" /> : <Eye className="h-12 w-12 mx-auto" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Coming soon
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'favorites' ? 'Your favorite NFTs' : 'NFTs you\'re watching'} will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}