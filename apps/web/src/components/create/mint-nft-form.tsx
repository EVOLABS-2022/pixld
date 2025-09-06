'use client';

import { useState } from 'react';
import { Upload, Plus, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface Collection {
  id: string;
  address: string;
  name: string;
  symbol: string;
  standard: string;
  totalSupply: number;
  maxSupply: number | null;
}

interface Property {
  trait_type: string;
  value: string;
}

interface MintNFTFormProps {
  collections: Collection[];
  selectedCollection?: string;
}

export function MintNFTForm({ collections, selectedCollection }: MintNFTFormProps) {
  const [formData, setFormData] = useState({
    collectionId: selectedCollection || (collections[0]?.id || ''),
    name: '',
    description: '',
    imageFile: null as File | null,
    animationFile: null as File | null,
    recipient: '',
    quantity: '1',
    properties: [] as Property[],
  });

  const [step, setStep] = useState<'form' | 'minting' | 'success' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const selectedCollectionData = collections.find(c => c.id === formData.collectionId);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'imageFile' | 'animationFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handlePropertyChange = (index: number, field: 'trait_type' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.map((prop, i) => 
        i === index ? { ...prop, [field]: value } : prop
      )
    }));
  };

  const addProperty = () => {
    setFormData(prev => ({
      ...prev,
      properties: [...prev.properties, { trait_type: '', value: '' }]
    }));
  };

  const removeProperty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.collectionId || !formData.name || !formData.imageFile) {
      setError('Collection, name, and image are required');
      return;
    }

    try {
      setStep('minting');
      setError(null);

      // Import collection service
      const { collectionService } = await import('@/lib/collections');
      
      // Check wallet connection
      const walletState = (await import('@/lib/wallet')).walletManager.getState();
      if (!walletState.isConnected || !walletState.address) {
        throw new Error('Please connect your wallet first');
      }

      // Find the selected collection
      const selectedCollection = collections.find(c => c.id === formData.collectionId);
      if (!selectedCollection) {
        throw new Error('Selected collection not found');
      }

      // Upload image to IPFS
      const imageIPFS = await collectionService.uploadFileToIPFS(formData.imageFile);
      let animationIPFS = '';
      
      if (formData.animationFile) {
        animationIPFS = await collectionService.uploadFileToIPFS(formData.animationFile);
      }

      // Create NFT metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: `ipfs://${imageIPFS}`,
        ...(animationIPFS && { animation_url: `ipfs://${animationIPFS}` }),
        attributes: formData.properties.filter(p => p.trait_type && p.value).map(p => ({
          trait_type: p.trait_type,
          value: p.value,
        })),
      };

      // Upload metadata to IPFS
      const metadataIPFS = await collectionService.uploadToIPFS(metadata);
      const tokenURI = `ipfs://${metadataIPFS}`;

      // Determine recipient
      const recipient = formData.recipient || walletState.address;

      // Mint NFT(s)
      if (isBulkMode || parseInt(formData.quantity) > 1) {
        // Batch mint
        const tokenURIs = Array(parseInt(formData.quantity)).fill(tokenURI);
        const result = await collectionService.batchMintNFTs({
          collection: selectedCollection.address as `0x${string}`,
          to: recipient as `0x${string}`,
          tokenURIs,
        });
        
        console.log('Batch mint successful:', result);
        setMintedTokenId(result.startTokenId.toString());
      } else {
        // Single mint
        const result = await collectionService.mintNFT({
          collection: selectedCollection.address as `0x${string}`,
          to: recipient as `0x${string}`,
          tokenURI,
        });
        
        console.log('Mint successful:', result);
        setMintedTokenId(result.tokenId.toString());
      }

      setStep('success');
    } catch (err: any) {
      console.error('Minting failed:', err);
      setError(err.message || 'Minting failed. Please try again.');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('form');
    setError(null);
    setMintedTokenId(null);
    setFormData({
      ...formData,
      name: '',
      description: '',
      imageFile: null,
      animationFile: null,
      recipient: '',
      quantity: '1',
      properties: [],
    });
  };

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Upload className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Found</h3>
        <p className="text-gray-600 mb-6">
          You need to create a collection before you can mint NFTs.
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Create Collection
        </button>
      </div>
    );
  }

  if (step === 'minting') {
    return (
      <div className="text-center py-12">
        <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Minting NFT</h3>
        <p className="text-gray-600 mb-4">
          Please confirm the transaction in your wallet and wait for minting to complete.
        </p>
        <div className="text-sm text-gray-500">
          Uploading metadata to IPFS and minting on-chain...
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">NFT Minted Successfully!</h3>
        <p className="text-gray-600 mb-4">
          Your NFT has been minted and is now available in your collection.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-1">Token ID</div>
          <div className="font-mono text-sm text-gray-900">#{mintedTokenId}</div>
        </div>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Mint Another
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            View NFT
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Minting Failed</h3>
        <p className="text-gray-600 mb-6">
          {error || 'Something went wrong during minting. Please try again.'}
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
      {/* Collection Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Collection *
        </label>
        <select
          value={formData.collectionId}
          onChange={(e) => handleInputChange('collectionId', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {collections.map(collection => (
            <option key={collection.id} value={collection.id}>
              {collection.name} ({collection.symbol}) - {collection.totalSupply}/{collection.maxSupply || '∞'} minted
            </option>
          ))}
        </select>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={() => setIsBulkMode(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !isBulkMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Single Mint
        </button>
        <button
          type="button"
          onClick={() => setIsBulkMode(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isBulkMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bulk Mint
        </button>
      </div>

      {/* NFT Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          NFT Image *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {formData.imageFile ? (
            <div>
              <img
                src={URL.createObjectURL(formData.imageFile)}
                alt="Preview"
                className="w-32 h-32 mx-auto rounded-lg object-cover mb-2"
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
              <div className="text-sm text-gray-600 mb-2">Upload NFT image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('imageFile', e.target.files?.[0] || null)}
                className="hidden"
                id="nft-image"
              />
              <label
                htmlFor="nft-image"
                className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
              >
                Choose file
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Animation File (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Animation File (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          {formData.animationFile ? (
            <div>
              <div className="text-sm text-gray-600 mb-1">{formData.animationFile.name}</div>
              <div className="text-xs text-gray-500 mb-2">{(formData.animationFile.size / 1024 / 1024).toFixed(2)} MB</div>
              <button
                type="button"
                onClick={() => handleFileChange('animationFile', null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-2">Upload animation (GIF, MP4, WebM)</div>
              <input
                type="file"
                accept="video/mp4,video/webm,image/gif"
                onChange={(e) => handleFileChange('animationFile', e.target.files?.[0] || null)}
                className="hidden"
                id="animation-file"
              />
              <label
                htmlFor="animation-file"
                className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
              >
                Choose file
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="NFT Name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient {!isBulkMode && '(Optional)'}
          </label>
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
            placeholder={isBulkMode ? "0x..." : "Your address (default)"}
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
          placeholder="Describe your NFT..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Quantity (for ERC1155 or bulk) */}
      {(selectedCollectionData?.standard === 'ERC1155' || isBulkMode) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isBulkMode ? 'Number of NFTs' : 'Quantity'}
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Properties */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Properties (Optional)
          </label>
          <button
            type="button"
            onClick={addProperty}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Property
          </button>
        </div>
        
        {formData.properties.length > 0 && (
          <div className="space-y-3">
            {formData.properties.map((property, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Trait type (e.g., Color)"
                  value={property.trait_type}
                  onChange={(e) => handlePropertyChange(index, 'trait_type', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Blue)"
                  value={property.value}
                  onChange={(e) => handlePropertyChange(index, 'value', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeProperty(index)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
          disabled={!formData.collectionId || !formData.name || !formData.imageFile}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isBulkMode ? `Mint ${formData.quantity} NFTs` : 'Mint NFT'}
        </button>
      </div>
    </form>
  );
}