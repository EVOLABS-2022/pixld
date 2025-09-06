'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/logo-yellow.png"
                alt="Art Marketplace"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-white">Art Marketplace</span>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray rounded-md leading-5 text-white bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/collections" 
                className="text-gray hover:text-white font-medium"
              >
                Collections
              </Link>
              <Link 
                href="/trending" 
                className="text-gray hover:text-white font-medium"
              >
                Trending
              </Link>
              <Link 
                href="/create" 
                className="text-gray hover:text-white font-medium"
              >
                Create
              </Link>
              <Link 
                href="/dashboard" 
                className="text-gray hover:text-white font-medium"
              >
                Dashboard
              </Link>
            </nav>

            {/* Connect Wallet Button */}
            <button
              className="btn-primary inline-flex items-center text-sm font-medium"
              onClick={() => {
                // TODO: Implement wallet connection logic
                alert('Wallet connection will be implemented here');
              }}
            >
              Connect Wallet
            </button>

            {/* Profile Dropdown Placeholder */}
            <div className="relative">
              <button className="p-2 text-gray hover:text-white focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
                <User className="h-5 w-5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}