'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fashion-discovery-swiped';

export function useSwipedProducts() {
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSwipedIds(new Set(JSON.parse(stored)));
      } catch {
        setSwipedIds(new Set());
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...swipedIds]));
    }
  }, [swipedIds, isLoaded]);

  const markSwiped = useCallback((productId: string) => {
    setSwipedIds((prev) => new Set([...prev, productId]));
  }, []);

  const isSwiped = useCallback(
    (productId: string) => swipedIds.has(productId),
    [swipedIds]
  );

  const resetSwiped = useCallback(() => {
    setSwipedIds(new Set());
  }, []);

  return {
    swipedIds,
    markSwiped,
    isSwiped,
    resetSwiped,
    isLoaded,
    swipedCount: swipedIds.size,
  };
}
