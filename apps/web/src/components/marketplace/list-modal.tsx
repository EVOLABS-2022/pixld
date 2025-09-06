'use client';

import { useState } from 'react';
import { X, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

interface ListModalProps {
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
    owner: {
      address: string;
    };
  };
  children: React.ReactNode;
}

export function ListModal({ nft, children }: ListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success' | 'error'>('form');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ETH');
  const [duration, setDuration] = useState('7'); // days
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseFloat(price) || 0;
  const royaltyAmount = (priceNum * nft.collection.royaltyBps) / 10000;
  const platformFee = priceNum * 0.02; // 2% platform fee
  const youReceive = priceNum - royaltyAmount - platformFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setStep('processing');
      setError(null);

      // Import services dynamically to avoid SSR issues
      const { marketplaceService } = await import('@/lib/marketplace');
      
      // Check wallet connection
      const walletState = (await import('@/lib/wallet')).walletManager.getState();
      if (!walletState.isConnected || !walletState.address) {
        throw new Error('Please connect your wallet first');
      }

      // Check if marketplace is approved to transfer the NFT
      const isApproved = await marketplaceService.checkApproval(
        nft.collection.address as `0x${string}`,
        walletState.address as `0x${string}`
      );

      if (!isApproved) {
        // First approve the marketplace
        await marketplaceService.approveMarketplace(nft.collection.address as `0x${string}`);
      }

      // Calculate duration in seconds
      let durationSeconds = 0;
      if (duration !== '0') {
        durationSeconds = parseInt(duration) * 24 * 60 * 60; // Convert days to seconds
      }

      // Create the listing
      const { ask, signature } = await marketplaceService.createAsk({
        collection: nft.collection.address as `0x${string}`,
        tokenId: BigInt(nft.tokenId),
        price: price,
        duration: durationSeconds,
        currency: currency === 'ETH' ? '0x0000000000000000000000000000000000000000' as `0x${string}` : undefined,
        quantity: 1n,
      });

      // In a real app, you'd save this listing to your backend/database
      console.log('Listing created:', { ask, signature });

      setStep('success');
    } catch (err: any) {
      console.error('Listing failed:', err);
      setError(err.message || 'Failed to create listing. Please try again.');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('form');
    setPrice('');
    setCurrency('ETH');
    setDuration('7');
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
            {step === 'form' && 'List for sale'}
            {step === 'confirm' && 'Confirm listing'}
            {step === 'processing' && 'Creating listing'}
            {step === 'success' && 'Listed successfully!'}
            {step === 'error' && 'Listing failed'}
          </h2>
          <button 
            onClick={reset}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

            {/* Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Price
              </label>
              <div className="flex">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-l-lg border border-r-0 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                >
                  <option value="ETH">ETH</option>
                  <option value="WETH">WETH</option>
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm mt-1">{error}</div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="30">1 month</option>
                <option value="90">3 months</option>
                <option value="0">No expiration</option>
              </select>
            </div>

            {/* Fees Breakdown */}
            {priceNum > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listing price</span>
                  <span>{price} {currency}</span>
                </div>
                {royaltyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creator royalty ({(nft.collection.royaltyBps / 100).toFixed(1)}%)</span>
                    <span>-{royaltyAmount.toFixed(4)} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform fee (2%)</span>
                  <span>-{platformFee.toFixed(4)} {currency}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>You receive</span>
                  <span>{youReceive.toFixed(4)} {currency}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!price || priceNum <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {step === 'confirm' && (
          <div className="p-6 space-y-6">
            {/* Summary */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {price} {currency}
              </div>
              <div className="text-gray-600">
                Listing {nft.name || `${nft.collection.name} #${nft.tokenId}`}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">Before you continue</div>
                  <div className="text-yellow-700 mt-1">
                    Make sure you have approved this contract to transfer your NFT. You'll need to confirm this transaction in your wallet.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create listing
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-900 mb-2">Creating listing</div>
            <div className="text-gray-600">
              Please confirm the transaction in your wallet and wait for it to be processed.
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">Listed successfully!</div>
            <div className="text-gray-600 mb-6">
              Your NFT is now listed for {price} {currency}. It will appear in the marketplace shortly.
            </div>
            
            <button
              onClick={reset}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="p-6 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-lg font-medium text-gray-900 mb-2">Listing failed</div>
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
                  setStep('form');
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