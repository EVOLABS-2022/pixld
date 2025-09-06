import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEther(wei: string | bigint): string {
  const ethValue = Number(wei) / 1e18;
  if (ethValue === 0) return '0';
  if (ethValue < 0.0001) return '< 0.0001';
  if (ethValue < 1) return ethValue.toFixed(4);
  if (ethValue < 1000) return ethValue.toFixed(3);
  if (ethValue < 10000) return ethValue.toFixed(2);
  return ethValue.toFixed(1);
}

export function formatPrice(wei: string | bigint, currency: string = 'ETH'): string {
  return `${formatEther(wei)} ${currency}`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimeAgo(timestamp: string | number): string {
  const now = Date.now();
  const time = typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function calculateRoyaltyDisplay(bps: string): string {
  const percentage = (Number(bps) / 100).toFixed(1);
  return `${percentage}% (${bps}bps)`;
}

export function getIPFSUrl(uri: string): string {
  if (!uri) return '';
  
  if (uri.startsWith('ipfs://')) {
    const hash = uri.slice(7);
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  if (uri.startsWith('https://') || uri.startsWith('http://')) {
    return uri;
  }
  
  // Assume it's an IPFS hash
  return `https://ipfs.io/ipfs/${uri}`;
}