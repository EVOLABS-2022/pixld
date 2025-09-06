import { Header } from "@/components/layout/header";
import { CollectionCard } from "@/components/collections/collection-card";
import Link from "next/link";
import { TrendingUp, Star, Clock } from "lucide-react";

async function getFeaturedCollections() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections?featured=true&limit=6`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.collections || [];
  } catch (error) {
    console.error('Error fetching featured collections:', error);
    return [];
  }
}

async function getTrendingCollections() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections/trending?period=24h&limit=8`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.trending?.map((item: any) => item.collection).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching trending collections:', error);
    return [];
  }
}

async function getRecentCollections() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/collections?limit=6`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.collections || [];
  } catch (error) {
    console.error('Error fetching recent collections:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch data in parallel
  const [featuredCollections, trendingCollections, recentCollections] = await Promise.all([
    getFeaturedCollections(),
    getTrendingCollections(), 
    getRecentCollections()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
                Web3-Native Art Marketplace
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                Create, trade, and collect NFTs with enforced royalties. 
                Built on Abstract network with guaranteed creator compensation.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/collections"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Explore Collections
                </Link>
                <Link
                  href="/create"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Collection
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Collections */}
        {featuredCollections.length > 0 && (
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Featured Collections</h2>
                </div>
                <Link 
                  href="/collections?featured=true"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCollections.map((collection: any) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    showStats={true}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trending Collections */}
        {trendingCollections.length > 0 && (
          <section className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Trending in 24h</h2>
                </div>
                <Link 
                  href="/trending"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingCollections.map((collection: any) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    showStats={true}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recently Whitelisted */}
        {recentCollections.length > 0 && (
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Recently Added</h2>
                </div>
                <Link 
                  href="/collections"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentCollections.map((collection: any) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    showStats={true}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                Marketplace Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-4xl font-bold text-blue-400">2%</div>
                  <div className="text-gray-300">Platform Fee</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-400">100%</div>
                  <div className="text-gray-300">Royalty Enforcement</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-yellow-400">0%</div>
                  <div className="text-gray-300">Failed Royalty Payments</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Art Marketplace. Built on Abstract Network.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
