'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useSwipedProducts } from '@/hooks/useSwipedProducts';
import {
  useSubscriberProfile,
  SubscriberProfile,
  Silhouette,
  Tempo,
  Aesthetic,
  Palette,
  Vibe,
} from '@/hooks/useSubscriberProfile';
import { Product } from '@/types/product';

interface AppContextType {
  // Favorites
  favorites: Product[];
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  // Swiped
  swipedIds: Set<string>;
  markSwiped: (productId: string) => void;
  isSwiped: (productId: string) => boolean;
  resetSwiped: () => void;
  swipedCount: number;
  // Subscriber Profile
  profile: SubscriberProfile;
  profileInitials: string;
  hasCompletedOnboarding: boolean;
  updateSubscriberInfo: (data: {
    subscriberName?: string;
    contactMethod?: 'email' | 'phone';
    contactValue?: string;
  }) => void;
  updateMandate: (data: { silhouette?: Silhouette; tempo?: Tempo }) => void;
  updateBriefing: (data: { aesthetic?: Aesthetic; palette?: Palette; vibe?: Vibe }) => void;
  followBrand: (brandId: string) => void;
  unfollowBrand: (brandId: string) => void;
  isFollowingBrand: (brandId: string) => boolean;
  saveProfile: (updates: Partial<SubscriberProfile>) => void;
  // User
  userId: number | null;
  setUserId: (id: number) => void;
  // Loading
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
    isLoaded: favoritesLoaded,
  } = useFavorites();

  const {
    swipedIds,
    markSwiped,
    isSwiped,
    resetSwiped,
    isLoaded: swipedLoaded,
    swipedCount,
  } = useSwipedProducts();

  const {
    profile,
    isLoaded: profileLoaded,
    initials: profileInitials,
    hasCompletedOnboarding,
    userId,
    updateSubscriberInfo,
    updateMandate,
    updateBriefing,
    followBrand,
    unfollowBrand,
    isFollowingBrand,
    saveProfile,
    setUserId,
  } = useSubscriberProfile();

  const isLoaded = favoritesLoaded && swipedLoaded && profileLoaded;

  return (
    <AppContext.Provider
      value={{
        // Favorites
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        clearFavorites,
        // Swiped
        swipedIds,
        markSwiped,
        isSwiped,
        resetSwiped,
        swipedCount,
        // Subscriber Profile
        profile,
        profileInitials,
        hasCompletedOnboarding,
        updateSubscriberInfo,
        updateMandate,
        updateBriefing,
        followBrand,
        unfollowBrand,
        isFollowingBrand,
        saveProfile,
        // User
        userId,
        setUserId,
        // Loading
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
