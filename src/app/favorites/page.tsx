'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '@/components/Providers';
import { Header } from '@/components/Header';
import { FavoriteCard } from '@/components/FavoriteCard';
import { FolioFooter } from '@/components/FolioFooter';
import { SettingsDrawer } from '@/components/SettingsDrawer';

// Extract unique brands for settings
const availableBrands = [
  { id: 'aime-leon-dore', name: 'Aime Leon Dore' },
  { id: 'pompeii', name: 'Pompeii' },
];

export default function FavoritesPage() {
  const {
    favorites,
    removeFavorite,
    clearFavorites,
    profile,
    profileInitials,
    saveProfile,
    isLoaded,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--archive-white)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-px h-12 bg-[var(--soft-gray)] mb-4" />
          <span className="issue-label">Loading</span>
          <div className="w-px h-12 bg-[var(--soft-gray)] mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--archive-white)] pb-24">
      <Header
        title="Archive"
        issueTitle={
          favorites.length > 0
            ? `${favorites.length} Bookmarked`
            : 'Empty'
        }
        onReset={favorites.length > 0 ? clearFavorites : undefined}
      />

      <div className="px-4 pt-4">
        <div className="max-w-4xl mx-auto">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {/* Editorial empty state */}
              <div className="mb-8">
                <div className="w-px h-16 bg-[var(--soft-gray)] mx-auto mb-4" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="w-8 h-8 text-[var(--muted-text)] mx-auto"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </div>

              <h3 className="font-editorial text-xl text-[var(--ink-black)] mb-3">
                Your archive awaits
              </h3>

              <p className="editorial-note max-w-xs text-center text-sm leading-relaxed">
                Double-tap or use the bookmark icon while browsing to save pieces to your personal collection.
              </p>

              <div className="mt-8 w-px h-16 bg-[var(--soft-gray)]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {favorites.map((product, index) => (
                  <FavoriteCard
                    key={product.id}
                    product={product}
                    onRemove={() => removeFavorite(product.id)}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Folio Footer */}
      <FolioFooter
        issueTitle="SS26"
        issueYear="2026"
        currentPage={0}
        totalPages={0}
        subscriberInitials={profileInitials || undefined}
        favoritesCount={favorites.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSave={saveProfile}
        availableBrands={availableBrands}
      />
    </main>
  );
}
