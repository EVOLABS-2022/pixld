'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="relative z-30">
        <div className="absolute top-6 left-6">
          {/* Logo Button */}
          <button
            onClick={toggleMenu}
            className="flex items-center space-x-3 transition-transform hover:scale-105"
          >
            <Image
              src="/images/logo-yellow.png"
              alt="Art Marketplace"
              width={50}
              height={50}
              className="object-contain drop-shadow-lg"
            />
          </button>
        </div>
      </header>

      {/* Pop-out Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeMenu}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 w-80 h-full bg-surface/95 backdrop-blur-md border-r border-white/10 z-50 transform transition-transform duration-300 ease-out">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/logo-yellow.png"
                  alt="Art Marketplace"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-xl font-bold text-white">Art Marketplace</span>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-6 space-y-4">
              <Link
                href="/collections"
                onClick={closeMenu}
                className="flex items-center space-x-4 p-4 hover:bg-white/5 rounded-lg transition-colors group"
              >
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <span className="text-xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Explore Collections</h3>
                  <p className="text-sm text-gray">Discover amazing NFT collections</p>
                </div>
              </Link>

              <Link
                href="/create"
                onClick={closeMenu}
                className="flex items-center space-x-4 p-4 hover:bg-white/5 rounded-lg transition-colors group"
              >
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create</h3>
                  <p className="text-sm text-gray">Create your own NFT collection</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}