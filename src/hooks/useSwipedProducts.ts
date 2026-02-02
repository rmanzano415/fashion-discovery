'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fashion-discovery-swiped';
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

  const markSwiped = useCallback((productId: string, direction: 'left' | 'right' = 'right') => {
    setSwipedIds((prev) => new Set([...prev, productId]));
    // Write-through to API
    const storedId = localStorage.getItem(USER_ID_KEY);
    if (storedId) {
      const action = direction === 'right' ? 'swipe_right' : 'swipe_left';
      logInteraction(parseInt(storedId, 10), productId, action);
    }
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
