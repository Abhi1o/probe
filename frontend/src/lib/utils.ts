import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  // Handle null, undefined, or NaN values
  if (num == null || isNaN(num)) {
    return '0';
  }
  
  // Convert to number if it's a string
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (numValue >= 1_000_000_000) {
    return `${(numValue / 1_000_000_000).toFixed(2)}B`;
  }
  if (numValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(2)}M`;
  }
  if (numValue >= 1_000) {
    return `${(numValue / 1_000).toFixed(2)}K`;
  }
  return numValue.toString();
}

export function formatSOL(lamports: string | number | null | undefined): string {
  // Handle null, undefined values
  if (lamports == null) {
    return '0 SOL';
  }
  
  try {
    // Convert string to number (lamports are often returned as strings for BigInt)
    const lamportsValue = typeof lamports === 'string' ? parseFloat(lamports) : lamports;
    
    if (isNaN(lamportsValue)) {
      return '0 SOL';
    }
    
    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    const sol = lamportsValue / 1_000_000_000;
    
    // Format with appropriate precision
    if (sol >= 1000) {
      return `${sol.toFixed(2)} SOL`;
    } else if (sol >= 1) {
      return `${sol.toFixed(4)} SOL`;
    } else if (sol >= 0.0001) {
      return `${sol.toFixed(6)} SOL`;
    } else {
      return `${sol.toFixed(9)} SOL`;
    }
  } catch (error) {
    return '0 SOL';
  }
}

export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) {
    return '0.0%';
  }
  
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(decimals)}%`;
  } catch (error) {
    return '0.0%';
  }
}

export function formatAddress(address: string | null | undefined, chars = 4): string {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
  } catch (error) {
    return 'Invalid Date';
  }
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  } finally {
    document.body.removeChild(textArea);
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
