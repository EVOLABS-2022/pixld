'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/wallet';
import { Wallet, ChevronDown, User, LogOut, Copy, ExternalLink } from 'lucide-react';

export function WalletButtonPlaceholder() {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    balance, 
    error, 
    connect, 
    disconnect,
    switchChain 
  } = useWallet();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowDropdown(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <button
        type="button"
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center space-x-2"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        <Wallet className="h-4 w-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center space-x-2"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <User className="h-3 w-3 text-white" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">{formatAddress(address!)}</div>
          <div className="text-xs text-gray-500">{parseFloat(balance || '0').toFixed(3)} ETH</div>
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{formatAddress(address!)}</div>
                  <div className="text-sm text-gray-500">{parseFloat(balance || '0').toFixed(4)} ETH</div>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={copyAddress}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
              >
                <Copy className="h-4 w-4" />
                <span>{copySuccess ? 'Copied!' : 'Copy Address'}</span>
              </button>

              <a
                href={`https://explorer.abstract.xyz/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View on Explorer</span>
              </a>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Navigate to dashboard
                  window.location.href = '/dashboard';
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
              >
                <User className="h-4 w-4" />
                <span>My Dashboard</span>
              </button>
            </div>

            <div className="border-t border-gray-100 py-2">
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="absolute right-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 z-20">
          {error}
        </div>
      )}
    </div>
  );
}