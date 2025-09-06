'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface BuyModalProps {
  nft: {
    id: string;
    tokenId: string;
    name?: string;
    imageUrl?: string;
    collection: {
      address: string;
      name: string;
      symbol: string;
      royaltyBps: number;
    };
    listing: {
      price: string;
      currency: string;
      currencySymbol?: string;
      maker: string;
    };
  };
  children: React.ReactNode;
}

export function BuyModal({ nft, children }: BuyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [error, setError] = useState<string | null>(null);

  const royaltyAmount = (parseFloat(nft.listing.price) * nft.collection.royaltyBps) / 10000;
  const platformFee = parseFloat(nft.listing.price) * 0.02; // 2% platform fee
  const total = parseFloat(nft.listing.price);

  const handlePurchase = async () => {
    try {
      setStep('processing');
      setError(null);

      // Import marketplace service dynamically to avoid SSR issues
      const { marketplaceService, parsePrice } = await import('@/lib/marketplace');
      const { useWallet } = await import('@/hooks/useWallet');

      // Check wallet connection
      const walletState = (await import('@/lib/wallet')).walletManager.getState();
      if (!walletState.isConnected || !walletState.address) {
        throw new Error('Please connect your wallet first');
      }

      // Create the ask object from the NFT listing data
      const ask = {
        maker: nft.listing.maker as `0x${string}`,
        collection: nft.collection.address as `0x${string}`,
        tokenId: BigInt(nft.tokenId),
        quantity: 1n,
        currency: (nft.listing.currency || '0x0000000000000000000000000000000000000000') as `0x${string}`,
        price: parsePrice(nft.listing.price),
        start: BigInt(nft.listing.start || 0),
        end: BigInt(nft.listing.end || 0),
        salt: BigInt(Math.floor(Math.random() * 1000000)),
        nonce: BigInt(Date.now()),
        standard: 0, // ERC721
        strategy: 0, // FIXED_PRICE
      };

      // For demo purposes, we'll create a mock signature
      // In reality, this would come from the backend/API where the listing was created
      const mockSignature = '0x' + '0'.repeat(130); // 65 bytes = 130 hex chars

      // Execute the purchase
      const txHash = await marketplaceService.fillAsk(ask, mockSignature, 1n);
      
      console.log('Purchase successful:', txHash);
      setStep('success');
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setError(err.message || 'Transaction failed. Please try again.');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('confirm');
    setError(null);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'confirm' && 'Complete your purchase'}
            {step === 'processing' && 'Processing transaction'}
            {step === 'success' && 'Purchase successful!'}
            {step === 'error' && 'Transaction failed'}
          </h2>
          <button 
            onClick={reset}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'confirm' && (
          <div className="p-6 space-y-6">
            {/* NFT Preview */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={nft.imageUrl || '/api/placeholder/80/80'}
                alt={nft.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <div className="font-semibold text-gray-900">
                  {nft.name || `${nft.collection.name} #${nft.tokenId}`}
                </div>
                <div className="text-sm text-gray-600">{nft.collection.name}</div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Price</span>
                <span className="font-semibold">Ξ{nft.listing.price}</span>
              </div>
              
              {royaltyAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Creator royalty ({(nft.collection.royaltyBps / 100).toFixed(1)}%)</span>
                  <span>Ξ{royaltyAmount.toFixed(6)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Platform fee (2%)</span>
                <span>Ξ{platformFee.toFixed(6)}</span>
              </div>
              
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Total</span>
                <span>Ξ{total.toFixed(6)}</span>
              </div>
            </div>

            {/* Wallet Balance Check */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">Wallet connection required</div>
                  <div className="text-yellow-700 mt-1">
                    Please connect your wallet to complete this purchase. Make sure you have sufficient ETH balance.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm purchase
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-900 mb-2">Processing transaction</div>
            <div className="text-gray-600">
              Please confirm the transaction in your wallet and wait for it to be processed on the blockchain.
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">Purchase successful!</div>
            <div className="text-gray-600 mb-6">
              Congratulations! You now own {nft.name || `${nft.collection.name} #${nft.tokenId}`}.
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center">
                View transaction
                <ExternalLink className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="p-6 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-lg font-medium text-gray-900 mb-2">Transaction failed</div>
            <div className="text-gray-600 mb-6">
              {error || 'Something went wrong. Please try again.'}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStep('confirm');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}