'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletManager, WalletState } from '@/lib/wallet';

export function useWallet() {
  const [state, setState] = useState<WalletState>(walletManager.getState());

  useEffect(() => {
    const unsubscribe = walletManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    try {
      await walletManager.connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletManager.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, []);

  const switchChain = useCallback(async () => {
    try {
      await walletManager.switchChain();
    } catch (error) {
      console.error('Failed to switch chain:', error);
      throw error;
    }
  }, []);

  const signMessage = useCallback(async (message: string) => {
    try {
      return await walletManager.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }, []);

  const signTypedData = useCallback(async (domain: any, types: any, message: any) => {
    try {
      return await walletManager.signTypedData(domain, types, message);
    } catch (error) {
      console.error('Failed to sign typed data:', error);
      throw error;
    }
  }, []);

  return {
    // State
    address: state.address,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    balance: state.balance,
    chainId: state.chainId,
    error: state.error,
    
    // Actions
    connect,
    disconnect,
    switchChain,
    signMessage,
    signTypedData,
  };
}