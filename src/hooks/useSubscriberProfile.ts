'use client';

import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type Silhouette = 'menswear' | 'womenswear' | 'all';
export type Tempo = 'weekly' | 'monthly' | 'quarterly';
export type Aesthetic = 'minimalist' | 'avant-garde' | 'street' | 'heritage';
export type Palette = 'earth' | 'monolith' | 'primary';
export type Vibe = 'understated' | 'bold' | 'eclectic' | 'refined';

export interface SubscriberProfile {
  subscriberName: string;
  contactMethod: 'email' | 'phone';
  contactValue: string;
  silhouette: Silhouette;
  tempo: Tempo;
  followedBrands: string[];
  aesthetic?: Aesthetic;
  palette?: Palette;
  vibe?: Vibe;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'zine-subscriber-profile';

const DEFAULT_PROFILE: SubscriberProfile = {
  subscriberName: '',
  contactMethod: 'email',
  contactValue: '',
  silhouette: 'all',
  tempo: 'monthly',
  followedBrands: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useSubscriberProfile() {
  const [profile, setProfile] = useState<SubscriberProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SubscriberProfile;
        setProfile(parsed);
      }
    } catch {
      // Silent fail, use defaults
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  const saveProfile = useCallback((updates: Partial<SubscriberProfile>) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        ...updates,
        updatedAt: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Silent fail
      }
      return updated;
    });
  }, []);

  // Update subscriber info
  const updateSubscriberInfo = useCallback(
    (data: {
      subscriberName?: string;
      contactMethod?: 'email' | 'phone';
      contactValue?: string;
    }) => {
      saveProfile(data);
    },
    [saveProfile]
  );

  // Update editorial mandate
  const updateMandate = useCallback(
    (data: { silhouette?: Silhouette; tempo?: Tempo }) => {
      saveProfile(data);
    },
    [saveProfile]
  );

  // Update style briefing
  const updateBriefing = useCallback(
    (data: { aesthetic?: Aesthetic; palette?: Palette; vibe?: Vibe }) => {
      saveProfile(data);
    },
    [saveProfile]
  );

  // Brand management
  const followBrand = useCallback(
    (brandId: string) => {
      setProfile((prev) => {
        if (prev.followedBrands.includes(brandId)) return prev;
        const updated = {
          ...prev,
          followedBrands: [...prev.followedBrands, brandId],
          updatedAt: Date.now(),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Silent fail
        }
        return updated;
      });
    },
    []
  );

  const unfollowBrand = useCallback(
    (brandId: string) => {
      setProfile((prev) => {
        const updated = {
          ...prev,
          followedBrands: prev.followedBrands.filter((b) => b !== brandId),
          updatedAt: Date.now(),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Silent fail
        }
        return updated;
      });
    },
    []
  );

  const isFollowingBrand = useCallback(
    (brandId: string) => profile.followedBrands.includes(brandId),
    [profile.followedBrands]
  );

  // Clear profile
  const clearProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail
    }
  }, []);

  // Computed values
  const initials = getInitials(profile.subscriberName);
  const hasCompletedOnboarding = profile.subscriberName.length > 0;

  return {
    profile,
    isLoaded,
    initials,
    hasCompletedOnboarding,
    updateSubscriberInfo,
    updateMandate,
    updateBriefing,
    followBrand,
    unfollowBrand,
    isFollowingBrand,
    clearProfile,
    saveProfile,
  };
}
