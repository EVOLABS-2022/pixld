'use client';

import Link from 'next/link';
import { Search, User, Plus } from 'lucide-react';
import { WalletButtonPlaceholder } from '@/components/wallet-button-placeholder';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Art Marketplace
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search collections, NFTs, or creators..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/collections" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Collections
              </Link>
              <Link 
                href="/trending" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Trending
              </Link>
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
            </nav>

            {/* Create Button */}
            <Link
              href="/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Link>

            {/* Profile Dropdown Placeholder */}
            <div className="relative">
              <button className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                <User className="h-5 w-5" />
              </button>
            </div>

            {/* Wallet Connection */}
            <WalletButtonPlaceholder />
          </div>
        </div>
      </div>
    </header>
  );
}