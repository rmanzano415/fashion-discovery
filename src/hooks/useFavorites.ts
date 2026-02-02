'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';

const STORAGE_KEY = 'fashion-discovery-favorites';
const USER_ID_KEY = 'zine-user-id';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function logInteraction(userId: number, sourceId: string, action: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sourceId, action }),
    });
  } catch {
    // Silent fail — localStorage remains source of truth offline
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const addFavorite = useCallback((product: Product) => {
    setFavorites((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
    // Write-through to API
    const storedId = localStorage.getItem(USER_ID_KEY);
    if (storedId) {
      logInteraction(parseInt(storedId, 10), product.id, 'favorite');
    }
  }, []);

  const removeFavorite = useCallback((productId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
    // Write-through to API
    const storedId = localStorage.getItem(USER_ID_KEY);
    if (storedId) {
      logInteraction(parseInt(storedId, 10), productId, 'unfavorite');
    }
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favorites.some((p) => p.id === productId),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
    isLoaded,
  };
}
