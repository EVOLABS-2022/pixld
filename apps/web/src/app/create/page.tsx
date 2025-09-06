import { Header } from "@/components/layout/header";
import { CreateCollectionForm } from "@/components/create/create-collection-form";
import { MintNFTForm } from "@/components/create/mint-nft-form";
import { CreatorStats } from "@/components/create/creator-stats";
import { CollectionManager } from "@/components/create/collection-manager";
import { 
  Plus,
  Palette,
  Coins,
  BarChart3,
  Settings,
  Upload
} from "lucide-react";
import Link from "next/link";

interface CreatePageProps {
  searchParams: {
    tab?: string;
    collection?: string;
  };
}

// Mock creator data - in real app this would come from wallet/auth
async function getCreatorData() {
  return {
    id: "0x1234...5678",
    address: "0x1234567890123456789012345678901234567890",
    displayName: "NFT Creator",
    collections: [
      {
        id: "0xabc123",
        address: "0xabc123def456ghi789jkl012mno345pqr678stu901",
        name: "Digital Dreams",
        symbol: "DD",
        standard: "ERC721C",
        totalSupply: 25,
        mintedCount: 25,
        maxSupply: 100,
        volume: "12.5",
        royalty: 750, // 7.5%
        verified: true,
        featured: false,
        createdAt: 1640995200,
      },
      {
        id: "0xdef456",
        address: "0xdef456ghi789jkl012mno345pqr678stu901vwx234",
        name: "Abstract Art",
        symbol: "AA",
        standard: "ERC1155",
        totalSupply: 150,
        mintedCount: 150,
        maxSupply: null, // unlimited
        volume: "8.2",
        royalty: 500, // 5%
        verified: false,
        featured: true,
        createdAt: 1641081600,
      }
    ],
    stats: {
      collectionsCount: 2,
      totalMinted: 175,
      totalVolume: "20.7",
      totalRoyalties: "1.24",
      activeListings: 12
    }
  };
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const creator = await getCreatorData();
  const activeTab = searchParams.tab || 'overview';
  const selectedCollection = searchParams.collection;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Studio</h1>
          <p className="mt-2 text-gray-600">
            Create, mint, and manage your NFT collections with enforced royalties
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Palette className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{creator.stats.collectionsCount}</div>
                <div className="text-sm text-gray-500">Collections</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{creator.stats.totalMinted}</div>
                <div className="text-sm text-gray-500">NFTs Minted</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">Ξ{creator.stats.totalVolume}</div>
                <div className="text-sm text-gray-500">Total Volume</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coins className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">Ξ{creator.stats.totalRoyalties}</div>
                <div className="text-sm text-gray-500">Total Royalties</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                <Link
                  href="/create?tab=overview"
                  className={`${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border-transparent'
                  } flex items-center px-3 py-2 rounded-md border font-medium transition-colors`}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Overview
                </Link>

                <Link
                  href="/create?tab=new-collection"
                  className={`${
                    activeTab === 'new-collection'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border-transparent'
                  } flex items-center px-3 py-2 rounded-md border font-medium transition-colors`}
                >
                  <Plus className="h-4 w-4 mr-3" />
                  New Collection
                </Link>

                <Link
                  href="/create?tab=mint"
                  className={`${
                    activeTab === 'mint'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border-transparent'
                  } flex items-center px-3 py-2 rounded-md border font-medium transition-colors`}
                >
                  <Upload className="h-4 w-4 mr-3" />
                  Mint NFT
                </Link>

                <Link
                  href="/create?tab=manage"
                  className={`${
                    activeTab === 'manage'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border-transparent'
                  } flex items-center px-3 py-2 rounded-md border font-medium transition-colors`}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Manage Collections
                </Link>
              </nav>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    Deploy Test Collection
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    Bulk Mint NFTs
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    Update Metadata
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activeTab === 'overview' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Creator Overview</h2>
                  <CreatorStats creator={creator} />
                </div>
              )}

              {activeTab === 'new-collection' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Collection</h2>
                  <CreateCollectionForm />
                </div>
              )}

              {activeTab === 'mint' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Mint NFT</h2>
                  <MintNFTForm 
                    collections={creator.collections}
                    selectedCollection={selectedCollection}
                  />
                </div>
              )}

              {activeTab === 'manage' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Collections</h2>
                  <CollectionManager collections={creator.collections} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              New to NFT creation? We're here to help!
            </h3>
            <p className="text-gray-600 mb-6">
              Learn how to create, mint, and manage your NFT collections with our comprehensive guides and resources.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/creating-collections"
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
              >
                Collection Guide
              </Link>
              <Link
                href="/docs/minting-nfts"
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
              >
                Minting Guide
              </Link>
              <Link
                href="/docs/royalties"
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
              >
                Royalties Guide
              </Link>
              <Link
                href="/support"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Get Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}