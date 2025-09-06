import { Header } from "@/components/layout/header";
import { CollectionCard } from "@/components/collections/collection-card";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Star, Clock } from "lucide-react";

async function getFeaturedCollections() {
  // Skip API calls during build
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/collections?featured=true&limit=6`, {
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
  // Skip API calls during build
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/collections/trending?period=24h&limit=8`, {
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
  // Skip API calls during build
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/collections?limit=6`, {
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
    <div className="min-h-screen bg-dark">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-surface border-b border-gray overflow-hidden min-h-[80vh] flex items-center">
          {/* Hero Banner Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-banner.png"
              alt="Art Marketplace Hero"
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/60 to-surface/90"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white sm:text-7xl mb-6 drop-shadow-2xl">
                Web3-Native Art Marketplace
              </h1>
              <p className="mt-6 text-xl text-gray max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                Create, trade, and collect NFTs with enforced royalties. 
                Built on Abstract network with guaranteed creator compensation.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/collections"
                  className="btn-primary text-lg font-medium px-8 py-4"
                >
                  Explore Collections
                </Link>
                <Link
                  href="/create"
                  className="btn-secondary text-lg font-medium px-8 py-4"
                >
                  Create Collection
                </Link>
              </div>
              
              {/* Scroll Indicator */}
              <div className="mt-16 flex justify-center">
                <div className="animate-bounce">
                  <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                    <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section - Always Visible */}
        <section className="py-16 bg-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Marketplace?</h2>
              <p className="text-xl text-gray max-w-3xl mx-auto">
                Experience the future of NFT trading with guaranteed royalty enforcement and creator protection.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Fast & Secure</h3>
                <p className="text-gray">Built on Abstract Network for lightning-fast transactions with low fees.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💎</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Royalty Guaranteed</h3>
                <p className="text-gray">100% royalty enforcement ensures creators get paid on every resale.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Creator Focused</h3>
                <p className="text-gray">Tools and features designed to empower artists and creators.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Collections */}
        {featuredCollections.length > 0 && (
          <section className="py-16 bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-white">Featured Collections</h2>
                </div>
                <Link 
                  href="/collections?featured=true"
                  className="text-primary hover:text-secondary font-medium"
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
          <section className="bg-surface py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  <h2 className="text-2xl font-bold text-white">Trending in 24h</h2>
                </div>
                <Link 
                  href="/trending"
                  className="text-primary hover:text-secondary font-medium"
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
          <section className="py-16 bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <h2 className="text-2xl font-bold text-white">Recently Added</h2>
                </div>
                <Link 
                  href="/collections"
                  className="text-primary hover:text-secondary font-medium"
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

        {/* Collections Placeholder - When no collections available */}
        {featuredCollections.length === 0 && trendingCollections.length === 0 && recentCollections.length === 0 && (
          <section className="py-16 bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-8">Collections Coming Soon</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-6">
                      <div className="w-full h-48 bg-card rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-4xl">🎨</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Featured Collection #{i}</h3>
                      <p className="text-gray text-sm">Discover amazing NFTs from talented creators.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="bg-surface py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                Marketplace Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-4xl font-bold text-primary">2%</div>
                  <div className="text-gray">Platform Fee</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-success">100%</div>
                  <div className="text-gray">Royalty Enforcement</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-warning">0%</div>
                  <div className="text-gray">Failed Royalty Payments</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray">
            <p>&copy; 2024 Art Marketplace. Built on Abstract Network.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
