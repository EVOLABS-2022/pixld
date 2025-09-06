'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface CreateCollectionFormProps {}

export function CreateCollectionForm({}: CreateCollectionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    standard: 'ERC721C', // ERC721C or ERC1155
    royaltyBps: '750', // 7.5% default
    maxSupply: '',
    imageFile: null as File | null,
    bannerFile: null as File | null,
  });

  const [step, setStep] = useState<'form' | 'deploying' | 'success' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'imageFile' | 'bannerFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.symbol) {
      setError('Name and symbol are required');
      return;
    }

    try {
      setStep('deploying');
      setError(null);

      // Import collection service dynamically
      const { collectionService } = await import('@/lib/collections');
      
      // Check wallet connection
      const walletState = (await import('@/lib/wallet')).walletManager.getState();
      if (!walletState.isConnected || !walletState.address) {
        throw new Error('Please connect your wallet first');
      }

      // Upload collection metadata to IPFS
      const contractMetadata = {
        name: formData.name,
        description: formData.description,
        image: formData.imageFile ? await uploadImage(formData.imageFile) : '',
        banner_image: formData.bannerFile ? await uploadImage(formData.bannerFile) : '',
        external_link: '',
        fee_recipient: walletState.address,
        seller_fee_basis_points: parseInt(formData.royaltyBps),
      };

      const contractURI = await collectionService.uploadToIPFS(contractMetadata);
      const contractURIFormatted = `ipfs://${contractURI}`;

      // Deploy the collection
      const result = await collectionService.deployERC721CCollection({
        name: formData.name,
        symbol: formData.symbol,
        royaltyBps: parseInt(formData.royaltyBps),
        contractURI: contractURIFormatted,
      });

      console.log('Collection deployed:', result);
      setDeployedAddress(result.collectionAddress);
      setStep('success');
    } catch (err: any) {
      console.error('Deployment failed:', err);
      setError(err.message || 'Deployment failed. Please try again.');
      setStep('error');
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const { collectionService } = await import('@/lib/collections');
      const ipfsHash = await collectionService.uploadFileToIPFS(file);
      return `ipfs://${ipfsHash}`;
    } catch (error) {
      console.error('Image upload failed:', error);
      return '';
    }
  };

  const reset = () => {
    setStep('form');
    setError(null);
    setDeployedAddress(null);
  };

  if (step === 'deploying') {
    return (
      <div className="text-center py-12">
        <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Deploying Collection</h3>
        <p className="text-gray-600 mb-4">
          Please confirm the transaction in your wallet and wait for deployment to complete.
        </p>
        <div className="text-sm text-gray-500">
          This may take a few minutes depending on network congestion.
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Collection Deployed!</h3>
        <p className="text-gray-600 mb-4">
          Your NFT collection has been successfully deployed and is ready for minting.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-1">Contract Address</div>
          <div className="font-mono text-sm text-gray-900">{deployedAddress}</div>
        </div>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Create Another
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Start Minting
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Deployment Failed</h3>
        <p className="text-gray-600 mb-6">
          {error || 'Something went wrong during deployment. Please try again.'}
        </p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setStep('form')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Collection Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collection Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {formData.imageFile ? (
              <div>
                <img
                  src={URL.createObjectURL(formData.imageFile)}
                  alt="Preview"
                  className="w-24 h-24 mx-auto rounded-lg object-cover mb-2"
                />
                <div className="text-sm text-gray-600">{formData.imageFile.name}</div>
                <button
                  type="button"
                  onClick={() => handleFileChange('imageFile', null)}
                  className="text-sm text-red-600 hover:text-red-700 mt-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-2">Upload collection image</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('imageFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="collection-image"
                />
                <label
                  htmlFor="collection-image"
                  className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
                >
                  Choose file
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Banner Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banner Image (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {formData.bannerFile ? (
              <div>
                <img
                  src={URL.createObjectURL(formData.bannerFile)}
                  alt="Banner preview"
                  className="w-full h-16 mx-auto rounded object-cover mb-2"
                />
                <div className="text-sm text-gray-600">{formData.bannerFile.name}</div>
                <button
                  type="button"
                  onClick={() => handleFileChange('bannerFile', null)}
                  className="text-sm text-red-600 hover:text-red-700 mt-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-2">Upload banner image</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('bannerFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="banner-image"
                />
                <label
                  htmlFor="banner-image"
                  className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
                >
                  Choose file
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="My Awesome Collection"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symbol *
          </label>
          <input
            type="text"
            required
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
            placeholder="MAC"
            maxLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your collection..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Token Standard
          </label>
          <select
            value={formData.standard}
            onChange={(e) => handleInputChange('standard', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ERC721C">ERC721C (Unique NFTs)</option>
            <option value="ERC1155">ERC1155 (Multi-edition)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Royalty (%)
          </label>
          <select
            value={formData.royaltyBps}
            onChange={(e) => handleInputChange('royaltyBps', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">0% (No royalties)</option>
            <option value="250">2.5%</option>
            <option value="500">5%</option>
            <option value="750">7.5%</option>
            <option value="1000">10% (Maximum)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Supply (Optional)
          </label>
          <input
            type="number"
            value={formData.maxSupply}
            onChange={(e) => handleInputChange('maxSupply', e.target.value)}
            placeholder="Unlimited"
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-blue-800 mb-1">Collection Deployment</div>
            <div className="text-blue-700">
              Your collection will be deployed with enforced royalties. This means every sale will automatically pay royalties to you, ensuring ongoing revenue from your creations.
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!formData.name || !formData.symbol}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Deploy Collection
        </button>
      </div>
    </form>
  );
}