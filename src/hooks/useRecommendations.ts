'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/types/product';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RecommendedProduct extends Product {
  matchScore: number;
  matchQuality: string;
  position: number;
}

function parseProduct(raw: Record<string, unknown>): RecommendedProduct {
  const priceStr = (raw.price as string) || '$0';
  const priceNumeric = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

  return {
    id: raw.id as string,
    name: raw.name as string,
    price: priceStr,
    priceNumeric,
    images: (raw.images as string[]) || [],
    url: raw.url as string,
    brand: raw.brand as string,
    category: raw.category as string | undefined,
    description: raw.description as string | undefined,
    colors: raw.colors as string[] | undefined,
    sizes: raw.sizes as string[] | undefined,
    aiTags: raw.aiTags as Product['aiTags'],
    taggedAt: raw.taggedAt as string | undefined,
    matchScore: (raw.matchScore as number) || 0,
    matchQuality: (raw.matchQuality as string) || 'unknown',
    position: (raw.position as number) || 0,
  };
}

export function useRecommendations(userId: number | null) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<number | null>(null);

  const fetchRecommendations = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/recommendations/${id}/curated`);
      if (!res.ok) {
        throw new Error(`Failed to load recommendations (${res.status})`);
      }
      const data = await res.json();
      const parsed = ((data.products as Record<string, unknown>[]) || []).map(parseProduct);
      setProducts(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recommendations');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId !== null && userId !== fetchedRef.current) {
      fetchedRef.current = userId;
      fetchRecommendations(userId);
    }
  }, [userId, fetchRecommendations]);

  const refetch = useCallback(() => {
    if (userId !== null) {
      fetchedRef.current = null;
      fetchRecommendations(userId);
    }
  }, [userId, fetchRecommendations]);

  return { products, isLoading, error, refetch };
}
