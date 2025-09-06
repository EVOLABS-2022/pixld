import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { abstractTestnet } from 'viem/chains';

// Chain configuration for Abstract testnet
export const abstractChain = abstractTestnet;

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: abstractChain,
  transport: http(),
});

// Wallet connection types
export interface WalletState {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
  balance?: string;
  chainId?: number;
  error?: string;
}

export class WalletManager {
  private static instance: WalletManager;
  private listeners: Set<(state: WalletState) => void> = new Set();
  private state: WalletState = {
    isConnected: false,
    isConnecting: false,
  };

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  private constructor() {
    // Initialize wallet state
    this.initializeWallet();
  }

  private async initializeWallet() {
    if (typeof window === 'undefined') return;

    // Check if already connected
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await this.handleAccountChange(accounts);
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }

      // Set up event listeners
      window.ethereum.on('accountsChanged', this.handleAccountChange.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChange.bind(this));
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  private async handleAccountChange(accounts: string[]) {
    if (accounts.length > 0) {
      const balance = await this.getBalance(accounts[0]);
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      this.setState({
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
        balance,
        chainId: parseInt(chainId, 16),
        error: undefined,
      });
    } else {
      this.handleDisconnect();
    }
  }

  private handleChainChange(chainId: string) {
    this.setState({
      ...this.state,
      chainId: parseInt(chainId, 16),
    });
    
    // Reload page if not on correct chain
    if (parseInt(chainId, 16) !== abstractChain.id) {
      window.location.reload();
    }
  }

  private handleDisconnect() {
    this.setState({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      balance: undefined,
      chainId: undefined,
      error: undefined,
    });
  }

  private async getBalance(address: string): Promise<string> {
    try {
      const balance = await publicClient.getBalance({ address: address as `0x${string}` });
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  private setState(newState: Partial<WalletState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Public methods
  public subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): WalletState {
    return this.state;
  }

  public async connect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    this.setState({ isConnecting: true, error: undefined });

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Check if on correct chain
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);

      if (currentChainId !== abstractChain.id) {
        await this.switchChain();
      }

      await this.handleAccountChange(accounts);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      this.setState({
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    // Note: MetaMask doesn't have a disconnect method
    // We just clear our local state
    this.handleDisconnect();
  }

  public async switchChain(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${abstractChain.id.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added to wallet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${abstractChain.id.toString(16)}`,
                chainName: abstractChain.name,
                nativeCurrency: abstractChain.nativeCurrency,
                rpcUrls: [abstractChain.rpcUrls.default.http[0]],
                blockExplorerUrls: [abstractChain.blockExplorers?.default.url],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Abstract network to wallet');
        }
      } else {
        throw new Error('Failed to switch to Abstract network');
      }
    }
  }

  public async getWalletClient() {
    if (!window.ethereum || !this.state.isConnected) {
      throw new Error('Wallet not connected');
    }

    return createWalletClient({
      chain: abstractChain,
      transport: custom(window.ethereum),
    });
  }

  public async signMessage(message: string): Promise<string> {
    const walletClient = await this.getWalletClient();
    if (!this.state.address) {
      throw new Error('No address available');
    }

    return await walletClient.signMessage({
      account: this.state.address as `0x${string}`,
      message,
    });
  }

  public async signTypedData(domain: any, types: any, message: any): Promise<string> {
    const walletClient = await this.getWalletClient();
    if (!this.state.address) {
      throw new Error('No address available');
    }

    return await walletClient.signTypedData({
      account: this.state.address as `0x${string}`,
      domain,
      types,
      primaryType: Object.keys(types)[0],
      message,
    });
  }
}

// Global wallet manager instance
export const walletManager = WalletManager.getInstance();

// Utility functions
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}