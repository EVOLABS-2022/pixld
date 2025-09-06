import { Header } from "@/components/layout/header";
import { CollectionCard } from "@/components/collections/collection-card";
import { Filter, SortAsc } from "lucide-react";

interface CollectionsPageProps {
  searchParams: {
    page?: string;
    featured?: string;
    standard?: string;
    orderBy?: string;
    orderDirection?: string;
  };
}

async function getCollections(searchParams: any) {
  try {
    const params = new URLSearchParams();
    
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.featured) params.set('featured', searchParams.featured);
    if (searchParams.standard) params.set('standard', searchParams.standard);
    if (searchParams.orderBy) params.set('orderBy', searchParams.orderBy);
    if (searchParams.orderDirection) params.set('orderDirection', searchParams.orderDirection);
    
    params.set('limit', '20'); // Show more on dedicated collections page
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections?${params.toString()}`, {
      next: { revalidate: 120 } // Cache for 2 minutes
    });
    
    if (!res.ok) throw new Error('Failed to fetch collections');
    
    const data = await res.json();
    return {
      collections: data.collections || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      collections: [],
      pagination: {}
    };
  }
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const { collections, pagination } = await getCollections(searchParams);
  
  const isFiltered = searchParams.featured || searchParams.standard;
  const currentPage = parseInt(searchParams.page || '1');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isFiltered ? (
                searchParams.featured ? 'Featured Collections' :
                searchParams.standard ? `${searchParams.standard} Collections` :
                'Collections'
              ) : 'All Collections'}
            </h1>
            <p className="mt-2 text-gray-600">
              Discover and collect from whitelisted NFT collections
            </p>
          </div>
          
          {/* Filters & Sort */}
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={searchParams.standard || ''}
              >
                <option value="">All Standards</option>
                <option value="ERC721C">ERC721C</option>
                <option value="ERC1155">ERC1155</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={`${searchParams.orderBy || 'createdAt'}_${searchParams.orderDirection || 'desc'}`}
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="volume24h_desc">24h Volume ↓</option>
                <option value="volumeTotal_desc">Total Volume ↓</option>
                <option value="totalSupply_desc">Most Items</option>
                <option value="name_asc">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {collections.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {collections.map((collection: any) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  showStats={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.hasMore && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  {currentPage > 1 && (
                    <a
                      href={`/collections?${new URLSearchParams({
                        ...searchParams,
                        page: (currentPage - 1).toString()
                      }).toString()}`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous
                    </a>
                  )}
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {currentPage}
                  </span>
                  
                  {pagination.hasMore && (
                    <a
                      href={`/collections?${new URLSearchParams({
                        ...searchParams,
                        page: (currentPage + 1).toString()
                      }).toString()}`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Next
                    </a>
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
              No collections found
            </h3>
            <p className="text-gray-600">
              {isFiltered 
                ? 'Try adjusting your filters to see more collections.'
                : 'Collections will appear here once they are whitelisted.'
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}